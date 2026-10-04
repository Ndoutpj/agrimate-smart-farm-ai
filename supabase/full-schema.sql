-- profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  farm_name TEXT,
  farm_size_ha NUMERIC,
  location TEXT,
  crops TEXT[] DEFAULT '{}',
  livestock TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "own_delete" ON public.profiles FOR DELETE TO authenticated USING (auth.uid() = id);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER profiles_touch BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)));
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- tasks
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  due_at TIMESTAMPTZ,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  carried_over BOOLEAN NOT NULL DEFAULT false,
  task_date DATE NOT NULL DEFAULT (now()::date),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX tasks_user_date_idx ON public.tasks(user_id, task_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT ALL ON public.tasks TO service_role;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own_select" ON public.tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_insert" ON public.tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update" ON public.tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_delete" ON public.tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER tasks_touch BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
ALTER FUNCTION public.touch_updated_at() SET search_path = public;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;
-- 1) Extend profiles with subscription fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS subscription_status text,
  ADD COLUMN IF NOT EXISTS next_billing_date timestamptz,
  ADD COLUMN IF NOT EXISTS payfast_token text,
  ADD COLUMN IF NOT EXISTS subscription_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS subscription_cancelled_at timestamptz;

-- 2) Payment events (ITN log / billing history)
CREATE TABLE IF NOT EXISTS public.payment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  m_payment_id text,
  pf_payment_id text,
  payment_status text,
  amount_gross numeric,
  token text,
  billing_date timestamptz,
  raw jsonb NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_events TO authenticated;
GRANT ALL ON public.payment_events TO service_role;

ALTER TABLE public.payment_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select_events" ON public.payment_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- 3) Diagnosis usage (free tier rate-limit)
CREATE TABLE IF NOT EXISTS public.diagnosis_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  used_on date NOT NULL DEFAULT (now())::date,
  count integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, used_on)
);

GRANT SELECT, INSERT, UPDATE ON public.diagnosis_usage TO authenticated;
GRANT ALL ON public.diagnosis_usage TO service_role;

ALTER TABLE public.diagnosis_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "own_select_usage" ON public.diagnosis_usage
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own_insert_usage" ON public.diagnosis_usage
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own_update_usage" ON public.diagnosis_usage
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_payment_events_user ON public.payment_events(user_id, created_at DESC);

CREATE TYPE public.account_type AS ENUM ('farmer', 'buyer', 'service_provider');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified');

ALTER TABLE public.profiles
  ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'farmer',
  ADD COLUMN is_service_provider_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN verification_submitted_at timestamptz,
  ADD COLUMN verified_at timestamptz;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  acct public.account_type;
BEGIN
  BEGIN
    acct := COALESCE((NEW.raw_user_meta_data->>'account_type')::public.account_type, 'farmer');
  EXCEPTION WHEN others THEN
    acct := 'farmer';
  END;

  INSERT INTO public.profiles (id, full_name, account_type)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    acct
  );
  RETURN NEW;
END;
$function$;

-- Listings
CREATE TABLE public.listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL,
  title text NOT NULL,
  crop text NOT NULL,
  description text,
  unit text NOT NULL DEFAULT 'kg',
  price_per_unit numeric NOT NULL CHECK (price_per_unit >= 0),
  quantity_available numeric NOT NULL CHECK (quantity_available >= 0),
  location text,
  image_url text,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active','sold','closed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.listings TO authenticated;
GRANT ALL ON public.listings TO service_role;
ALTER TABLE public.listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "any auth can view listings" ON public.listings FOR SELECT TO authenticated USING (true);
CREATE POLICY "farmer inserts own listing" ON public.listings FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "farmer updates own listing" ON public.listings FOR UPDATE TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "farmer deletes own listing" ON public.listings FOR DELETE TO authenticated USING (auth.uid() = farmer_id);
CREATE TRIGGER listings_touch_updated_at BEFORE UPDATE ON public.listings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX listings_active_idx ON public.listings (status, created_at DESC);

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id uuid NOT NULL REFERENCES public.listings(id) ON DELETE CASCADE,
  buyer_id uuid NOT NULL,
  farmer_id uuid NOT NULL,
  quantity numeric NOT NULL CHECK (quantity > 0),
  total_price numeric NOT NULL CHECK (total_price >= 0),
  contact_phone text,
  notes text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','completed','cancelled')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties view orders" ON public.orders FOR SELECT TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);
CREATE POLICY "buyer creates order" ON public.orders FOR INSERT TO authenticated WITH CHECK (auth.uid() = buyer_id);
CREATE POLICY "parties update orders" ON public.orders FOR UPDATE TO authenticated USING (auth.uid() = buyer_id OR auth.uid() = farmer_id);
CREATE TRIGGER orders_touch_updated_at BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();
CREATE INDEX orders_buyer_idx ON public.orders (buyer_id, created_at DESC);
CREATE INDEX orders_farmer_idx ON public.orders (farmer_id, created_at DESC);

-- Ratings
CREATE TABLE public.ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rater_id uuid NOT NULL,
  ratee_id uuid NOT NULL,
  stars int NOT NULL CHECK (stars BETWEEN 1 AND 5),
  comment text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (order_id, rater_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ratings TO authenticated;
GRANT ALL ON public.ratings TO service_role;
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "any auth views ratings" ON public.ratings FOR SELECT TO authenticated USING (true);
CREATE POLICY "rater inserts own rating" ON public.ratings FOR INSERT TO authenticated WITH CHECK (auth.uid() = rater_id);
CREATE POLICY "rater updates own rating" ON public.ratings FOR UPDATE TO authenticated USING (auth.uid() = rater_id);

-- Messages (per order chat)
CREATE TABLE public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties view messages" ON public.messages FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.farmer_id = auth.uid()))
);
CREATE POLICY "parties send messages" ON public.messages FOR INSERT TO authenticated WITH CHECK (
  auth.uid() = sender_id AND EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (o.buyer_id = auth.uid() OR o.farmer_id = auth.uid()))
);
CREATE INDEX messages_order_idx ON public.messages (order_id, created_at);
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

CREATE POLICY "listings_read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'listings');
CREATE POLICY "listings_insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listings_update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "listings_delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'listings' AND (storage.foldername(name))[1] = auth.uid()::text);

-- SERVICES
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL,
  title text NOT NULL,
  category text NOT NULL,
  description text,
  price_per_unit numeric NOT NULL,
  unit text NOT NULL DEFAULT 'hour',
  location text,
  service_area text,
  image_url text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "any auth views services" ON public.services FOR SELECT TO authenticated USING (true);
CREATE POLICY "provider inserts own service" ON public.services FOR INSERT TO authenticated WITH CHECK (auth.uid() = provider_id);
CREATE POLICY "provider updates own service" ON public.services FOR UPDATE TO authenticated USING (auth.uid() = provider_id);
CREATE POLICY "provider deletes own service" ON public.services FOR DELETE TO authenticated USING (auth.uid() = provider_id);
CREATE TRIGGER services_touch BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- BOOKINGS
CREATE TABLE public.bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL,
  farmer_id uuid NOT NULL,
  provider_id uuid NOT NULL,
  start_date date NOT NULL,
  end_date date,
  hours numeric,
  total_price numeric NOT NULL,
  contact_phone text,
  notes text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties view bookings" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = farmer_id OR auth.uid() = provider_id);
CREATE POLICY "farmer creates booking" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "parties update bookings" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = farmer_id OR auth.uid() = provider_id);
CREATE TRIGGER bookings_touch BEFORE UPDATE ON public.bookings FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- JOBS
CREATE TABLE public.jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  category text NOT NULL,
  location text,
  pay_rate numeric NOT NULL,
  pay_unit text NOT NULL DEFAULT 'day',
  start_date date,
  end_date date,
  workers_needed integer NOT NULL DEFAULT 1,
  status text NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT ALL ON public.jobs TO service_role;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "any auth views jobs" ON public.jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "farmer inserts own job" ON public.jobs FOR INSERT TO authenticated WITH CHECK (auth.uid() = farmer_id);
CREATE POLICY "farmer updates own job" ON public.jobs FOR UPDATE TO authenticated USING (auth.uid() = farmer_id);
CREATE POLICY "farmer deletes own job" ON public.jobs FOR DELETE TO authenticated USING (auth.uid() = farmer_id);
CREATE TRIGGER jobs_touch BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- JOB APPLICATIONS
CREATE TABLE public.job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL,
  applicant_id uuid NOT NULL,
  farmer_id uuid NOT NULL,
  cover_note text,
  contact_phone text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (job_id, applicant_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.job_applications TO authenticated;
GRANT ALL ON public.job_applications TO service_role;
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "parties view applications" ON public.job_applications FOR SELECT TO authenticated USING (auth.uid() = applicant_id OR auth.uid() = farmer_id);
CREATE POLICY "applicant inserts own application" ON public.job_applications FOR INSERT TO authenticated WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "parties update application" ON public.job_applications FOR UPDATE TO authenticated USING (auth.uid() = applicant_id OR auth.uid() = farmer_id);
CREATE TRIGGER job_applications_touch BEFORE UPDATE ON public.job_applications FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.farm_crops (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop TEXT NOT NULL,
  field_name TEXT,
  hectares NUMERIC(10,2) NOT NULL DEFAULT 0,
  planting_date DATE,
  expected_harvest_date DATE,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_crops TO authenticated;
GRANT ALL ON public.farm_crops TO service_role;
ALTER TABLE public.farm_crops ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own farm_crops" ON public.farm_crops FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER farm_crops_touch BEFORE UPDATE ON public.farm_crops FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE TABLE public.farm_journal_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES public.farm_crops(id) ON DELETE SET NULL,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  title TEXT NOT NULL,
  body TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_journal_entries TO authenticated;
GRANT ALL ON public.farm_journal_entries TO service_role;
ALTER TABLE public.farm_journal_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own journal" ON public.farm_journal_entries FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.irrigation_schedule (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES public.farm_crops(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL,
  time_of_day TIME NOT NULL DEFAULT '06:00',
  duration_minutes INT NOT NULL DEFAULT 30,
  method TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.irrigation_schedule TO authenticated;
GRANT ALL ON public.irrigation_schedule TO service_role;
ALTER TABLE public.irrigation_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own irrigation" ON public.irrigation_schedule FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.farm_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES public.farm_crops(id) ON DELETE SET NULL,
  category TEXT NOT NULL,
  amount_zar NUMERIC(12,2) NOT NULL,
  spent_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_expenses TO authenticated;
GRANT ALL ON public.farm_expenses TO service_role;
ALTER TABLE public.farm_expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own expenses" ON public.farm_expenses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.farm_sales (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  crop_id UUID REFERENCES public.farm_crops(id) ON DELETE SET NULL,
  buyer TEXT,
  quantity_kg NUMERIC(12,2),
  amount_zar NUMERIC(12,2) NOT NULL,
  sold_on DATE NOT NULL DEFAULT CURRENT_DATE,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.farm_sales TO authenticated;
GRANT ALL ON public.farm_sales TO service_role;
ALTER TABLE public.farm_sales ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sales" ON public.farm_sales FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- COURSES
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration_minutes INT DEFAULT 15,
  content TEXT,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.courses TO anon, authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Courses are readable by everyone" ON public.courses FOR SELECT USING (is_published = true);
CREATE TRIGGER courses_touch BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- COURSE PROGRESS
CREATE TABLE public.course_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  progress INT NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  certificate_code TEXT UNIQUE,
  user_full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_progress TO authenticated;
GRANT SELECT ON public.course_progress TO anon;
GRANT ALL ON public.course_progress TO service_role;
ALTER TABLE public.course_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage their own progress" ON public.course_progress FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Anyone can verify a certificate by code" ON public.course_progress FOR SELECT TO anon, authenticated USING (completed = true AND certificate_code IS NOT NULL);
CREATE TRIGGER course_progress_touch BEFORE UPDATE ON public.course_progress FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- GRANTS
CREATE TABLE public.grants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  provider TEXT,
  description TEXT,
  province TEXT,
  min_size_ha NUMERIC,
  max_size_ha NUMERIC,
  crops TEXT[],
  amount_zar NUMERIC,
  deadline DATE,
  url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.grants TO anon, authenticated;
GRANT ALL ON public.grants TO service_role;
ALTER TABLE public.grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Grants are readable by everyone" ON public.grants FOR SELECT USING (is_active = true);
CREATE TRIGGER grants_touch BEFORE UPDATE ON public.grants FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  type TEXT DEFAULT 'info',
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see their own notifications" ON public.notifications FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX notifications_user_read_idx ON public.notifications(user_id, read, created_at DESC);

-- SEED COURSES
INSERT INTO public.courses (title, description, category, duration_minutes, content) VALUES
('Soil Health Fundamentals', 'Learn how to test soil, balance pH, and build organic matter for higher yields.', 'Soil', 20,
'## Why soil health matters
Healthy soil holds water, feeds plants, and resists drought. This course covers the four pillars of soil health.

## 1. Test before you treat
Send a sample to your local extension office or use a home pH kit. Aim for pH 6.0–6.8 for most crops.

## 2. Build organic matter
Add compost (2–3 t/ha annually), grow cover crops, and avoid burning residue.

## 3. Rotate crops
Never plant the same family two seasons running. Maize → legumes → leafy greens is a strong rotation.

## 4. Reduce tillage
Less ploughing keeps fungal networks alive and stops erosion.

✅ Apply what you learned and your yields can rise 15–30% within two seasons.'),
('Water-Smart Irrigation', 'Drip vs sprinkler vs rainfed — choose the right system and schedule.', 'Water', 15,
'## Irrigation efficiency
Drip = 90% efficient. Sprinkler = 75%. Flood = 50%. Drip pays itself back in 2–4 seasons for high-value crops.

## Schedule by crop stage
- Germination: light, frequent
- Vegetative: deep, less frequent
- Flowering: never stress
- Maturation: taper off

## Mulch heavily
A 5cm mulch layer cuts evaporation by half.'),
('Integrated Pest Management', 'Reduce chemical sprays and protect beneficial insects.', 'Pest control', 18,
'## The IPM ladder
1. Prevention (resistant varieties, rotation)
2. Monitoring (scout weekly)
3. Biological control (lacewings, ladybirds)
4. Mechanical (traps, row cover)
5. Chemical (last resort, spot spray)

## Friendly insects
Never spray broad-spectrum at flowering — you''ll kill pollinators.'),
('Marketing Your Produce', 'Price your crops, find buyers, and negotiate fair contracts.', 'Business', 25,
'## Know your cost per kg
Calculate inputs + labor ÷ expected yield. Never sell below this.

## Direct vs wholesale
Direct = higher price, more work. Wholesale = lower price, more volume.

## Contracts
Get prices, quantities, and dates IN WRITING before planting.');

-- SEED GRANTS
INSERT INTO public.grants (title, provider, description, province, min_size_ha, max_size_ha, crops, amount_zar, deadline, url) VALUES
('Ilima/Letsema Smallholder Support', 'Dept. of Agriculture, Land Reform & Rural Development', 'Production input support for smallholder farmers — seeds, fertilizer, and mechanization vouchers.', NULL, 0.5, 50, ARRAY['maize','beans','vegetables'], 50000, '2026-09-30', 'https://www.dalrrd.gov.za'),
('CASP Comprehensive Agricultural Support', 'CASP', 'Infrastructure and capacity grants — boreholes, fencing, training. Apply via your provincial dept.', NULL, 1, 200, NULL, 250000, '2026-12-15', 'https://www.dalrrd.gov.za'),
('Land Bank Young Farmer Fund', 'Land Bank', 'Affordable loans and grants for farmers under 35.', NULL, 0, NULL, NULL, 500000, '2027-03-31', 'https://landbank.co.za'),
('Gauteng Vegetable Tunnel Initiative', 'Gauteng Dept. of Agriculture', 'Subsidised greenhouse tunnels for vegetable producers.', 'Gauteng', 0.1, 5, ARRAY['tomatoes','spinach','cabbage','peppers'], 80000, '2026-08-31', 'https://www.gauteng.gov.za'),
('Western Cape Drought Relief', 'WC Dept. of Agriculture', 'Emergency water infrastructure and feed subsidies for drought-affected farms.', 'Western Cape', 1, NULL, NULL, 120000, '2026-07-31', 'https://www.elsenburg.com'),
('KZN Sugarcane Replanting Support', 'KZN Dept. of Agriculture', 'Replanting subsidy for small-scale cane growers.', 'KwaZulu-Natal', 0.5, 100, ARRAY['sugarcane'], 65000, '2026-11-30', 'https://www.kzndard.gov.za'),
('Limpopo Macadamia Expansion', 'Limpopo Dept. of Agriculture', 'Establishment grant for new macadamia orchards.', 'Limpopo', 2, 50, ARRAY['macadamia'], 150000, '2027-02-28', 'https://www.limpopo.gov.za');
-- The original sample grant rows used invented amounts, deadlines and programme
-- descriptions. Hide those examples until an administrator replaces them with
-- verified, current opportunities and application links.
UPDATE public.grants
SET is_active = false,
    updated_at = now()
WHERE title IN (
  'Ilima/Letsema Smallholder Support',
  'CASP Comprehensive Agricultural Support',
  'Land Bank Young Farmer Fund',
  'Gauteng Vegetable Tunnel Initiative',
  'Western Cape Drought Relief',
  'KZN Sugarcane Replanting Support',
  'Limpopo Macadamia Expansion'
)
AND is_active = true;
