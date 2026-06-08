
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
