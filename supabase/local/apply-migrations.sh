#!/bin/sh
# Applies supabase/migrations/*.sql to the local Supabase database and seeds the
# storage bucket the marketplace uploads into.
#
# This is the self-hosted equivalent of `supabase db push`: applied migrations
# are recorded in supabase_migrations.schema_migrations, so re-running the
# compose stack is a no-op.
set -eu

echo "[migrate] waiting for database..."
until pg_isready -q -h "$PGHOST" -U "$PGUSER"; do
  sleep 2
done

psql -v ON_ERROR_STOP=1 -q -c 'create schema if not exists supabase_migrations'
psql -v ON_ERROR_STOP=1 -q -c 'create table if not exists supabase_migrations.schema_migrations (version text primary key, name text, inserted_at timestamptz not null default now())'

for file in /migrations/*.sql; do
  name=$(basename "$file" .sql)
  version=$(echo "$name" | cut -d_ -f1)
  applied=$(psql -tAq -c "select 1 from supabase_migrations.schema_migrations where version = '$version'")
  if [ "$applied" = "1" ]; then
    echo "[migrate] skip $name (already applied)"
    continue
  fi
  echo "[migrate] applying $name"
  psql -v ON_ERROR_STOP=1 -q -f "$file"
  psql -v ON_ERROR_STOP=1 -q -c "insert into supabase_migrations.schema_migrations (version, name) values ('$version', '$name')"
done

# Listing photos are stored in a public bucket named "listings".
psql -v ON_ERROR_STOP=1 -q -c "insert into storage.buckets (id, name, public) values ('listings', 'listings', true) on conflict (id) do update set public = true"

echo "[migrate] done"
