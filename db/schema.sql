create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_expires_at_idx on sessions(expires_at);

create table if not exists booking_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  item_type text not null check (item_type in ('flight', 'apartment', 'service')),
  item_id text not null,
  item_title text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  status text not null default 'created' check (status in ('created', 'payment_pending', 'paid', 'expired', 'cancelled')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);
create index if not exists booking_intents_user_id_idx on booking_intents(user_id);
create index if not exists booking_intents_expires_at_idx on booking_intents(expires_at);
