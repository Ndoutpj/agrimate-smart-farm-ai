
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
