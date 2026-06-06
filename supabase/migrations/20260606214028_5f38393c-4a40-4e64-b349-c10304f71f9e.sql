
CREATE TYPE public.account_type AS ENUM ('farmer', 'buyer', 'service_provider');
CREATE TYPE public.verification_status AS ENUM ('unverified', 'pending', 'verified');

ALTER TABLE public.profiles
  ADD COLUMN account_type public.account_type NOT NULL DEFAULT 'farmer',
  ADD COLUMN is_service_provider_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN verification_status public.verification_status NOT NULL DEFAULT 'unverified',
  ADD COLUMN verification_submitted_at timestamptz,
  ADD COLUMN verified_at timestamptz;
