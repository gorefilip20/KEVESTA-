create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  name text not null,
  password_hash text not null,
  email_verified_at timestamptz,
  created_at timestamptz not null default now()
);
alter table users add column if not exists email_verified_at timestamptz;

create table if not exists auth_email_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  token_type text not null check (token_type in ('verification', 'password_reset')),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists auth_email_tokens_lookup_idx on auth_email_tokens(token_hash, token_type);
create index if not exists auth_email_tokens_user_idx on auth_email_tokens(user_id, token_type);

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

create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete restrict,
  intent_id uuid not null unique references booking_intents(id) on delete restrict,
  item_type text not null check (item_type in ('flight', 'apartment', 'service')),
  item_id text not null,
  item_title text not null,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null default 'USD',
  status text not null default 'intent_created' check (status in ('intent_created', 'payment_pending', 'paid', 'failed', 'cancelled', 'refunded', 'expired')),
  status_rank integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_user_id_idx on bookings(user_id);
create index if not exists bookings_status_idx on bookings(status);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete restrict,
  provider text not null check (provider in ('column', 'crypto')),
  provider_payment_id text not null unique,
  idempotency_key text unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'failed', 'refunded')),
  status_rank integer not null default 10,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_booking_id_idx on payments(booking_id);

create table if not exists provider_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  event_id text not null,
  event_type text not null,
  payload jsonb not null,
  received_at timestamptz not null default now(),
  processed_at timestamptz,
  unique (provider, event_id)
);
