-- Runs on the first boot of the local Supabase database.
-- Gives the service roles the password from POSTGRES_PASSWORD so GoTrue,
-- PostgREST and Storage can connect. Development only.
\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
