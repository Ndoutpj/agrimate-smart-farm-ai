
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
