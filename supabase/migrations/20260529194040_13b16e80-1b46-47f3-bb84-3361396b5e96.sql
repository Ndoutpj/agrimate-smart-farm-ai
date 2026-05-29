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
