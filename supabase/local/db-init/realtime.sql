-- Runs on the first boot of the local Supabase database.
-- The self-hosted Realtime v2 service keeps its tables in the _realtime schema.
create schema if not exists _realtime;
alter schema _realtime owner to supabase_admin;
