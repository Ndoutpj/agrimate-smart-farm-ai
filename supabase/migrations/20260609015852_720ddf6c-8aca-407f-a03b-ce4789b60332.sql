
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
