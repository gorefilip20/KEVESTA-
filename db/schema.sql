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

create table if not exists mobile_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  revoked_at timestamptz,
  last_used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists mobile_sessions_user_id_idx on mobile_sessions(user_id);
create index if not exists mobile_sessions_active_idx on mobile_sessions(token_hash, expires_at) where revoked_at is null;

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
  status text not null default 'intent_created' check (status in ('intent_created', 'payment_pending', 'paid', 'refund_pending', 'failed', 'cancelled', 'refunded', 'expired')),
  status_rank integer not null default 10,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists bookings_user_id_idx on bookings(user_id);
create index if not exists bookings_status_idx on bookings(status);
alter table bookings drop constraint if exists bookings_status_check;
alter table bookings add constraint bookings_status_check check (status in ('intent_created', 'payment_pending', 'paid', 'refund_pending', 'failed', 'cancelled', 'refunded', 'expired'));

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete restrict,
  provider text not null check (provider in ('column', 'crypto')),
  provider_payment_id text not null unique,
  idempotency_key text unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'paid', 'refund_pending', 'failed', 'refunded')),
  status_rank integer not null default 10,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists payments_booking_id_idx on payments(booking_id);
alter table payments drop constraint if exists payments_status_check;
alter table payments add constraint payments_status_check check (status in ('pending', 'processing', 'paid', 'refund_pending', 'failed', 'refunded'));

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

create table if not exists refund_requests (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references bookings(id) on delete restrict,
  payment_id uuid not null references payments(id) on delete restrict,
  provider text not null,
  provider_refund_id text unique,
  status text not null default 'pending' check (status in ('pending', 'submitted', 'succeeded', 'failed')),
  reason text not null default 'customer_requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists financial_receipts (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null references bookings(id) on delete restrict,
  payment_id uuid not null references payments(id) on delete restrict,
  refund_request_id uuid references refund_requests(id) on delete set null,
  receipt_type text not null check (receipt_type in ('refund_requested', 'refund_completed')),
  receipt_number text not null unique,
  amount_cents integer not null check (amount_cents > 0),
  currency text not null,
  provider_reference text,
  issued_at timestamptz not null default now(),
  unique (booking_id, receipt_type)
);

create table if not exists notification_preferences (
  user_id uuid primary key references users(id) on delete cascade,
  phone_e164 text,
  sms_enabled boolean not null default false,
  push_enabled boolean not null default false,
  booking_updates boolean not null default true,
  refund_updates boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists push_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('ios', 'android', 'web')),
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now()
);
create index if not exists push_devices_user_idx on push_devices(user_id, enabled);

create table if not exists notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  booking_id uuid references bookings(id) on delete set null,
  channel text not null check (channel in ('sms', 'push')),
  event_type text not null,
  destination text not null,
  status text not null check (status in ('sent', 'skipped', 'failed')),
  provider_message_id text,
  error text,
  idempotency_key text not null unique,
  created_at timestamptz not null default now()
);
create index if not exists notification_deliveries_user_idx on notification_deliveries(user_id, created_at desc);

create table if not exists calendar_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  provider text not null check (provider in ('google', 'outlook')),
  access_token_encrypted text not null,
  refresh_token_encrypted text,
  expires_at timestamptz,
  calendar_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists calendar_sync_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  booking_id uuid not null references bookings(id) on delete cascade,
  provider text not null check (provider in ('google', 'outlook', 'ics')),
  external_event_id text,
  status text not null check (status in ('synced', 'failed')),
  error text,
  synced_at timestamptz not null default now(),
  unique (booking_id, provider)
);


-- KEVESTA unified trip workspace
create table if not exists trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
  name text not null,
  destination text,
  start_date date,
  end_date date,
  country_code text,
  cover_image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists trips_owner_idx on trips(owner_id, updated_at desc);
create table if not exists trip_members (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references trips(id) on delete cascade,
  user_id uuid references users(id) on delete cascade, email text not null, name text,
  role text not null default 'traveler' check (role in ('owner', 'traveler')),
  invite_token text unique, status text not null default 'invited' check (status in ('invited', 'accepted')),
  created_at timestamptz not null default now(), unique (trip_id, email)
);
create index if not exists trip_members_trip_idx on trip_members(trip_id);
create table if not exists trip_stops (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references trips(id) on delete cascade,
  title text not null, description text, location text, start_at timestamptz, end_at timestamptz,
  category text not null default 'place', position integer not null default 0,
  created_by uuid references users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists trip_stops_trip_idx on trip_stops(trip_id, position, start_at);
create table if not exists trip_documents (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references trips(id) on delete cascade,
  title text not null, document_type text not null default 'other', file_url text, reference text, expires_at date,
  created_by uuid references users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists trip_documents_trip_idx on trip_documents(trip_id, created_at desc);
create table if not exists trip_expenses (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references trips(id) on delete cascade,
  description text not null, amount_cents integer not null check (amount_cents >= 0), currency text not null default 'USD',
  paid_by uuid references users(id) on delete set null, split_type text not null default 'equal' check (split_type in ('equal', 'custom')),
  created_at timestamptz not null default now()
);
create index if not exists trip_expenses_trip_idx on trip_expenses(trip_id, created_at desc);
create table if not exists trip_notes (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references trips(id) on delete cascade,
  title text not null, body text not null, created_by uuid references users(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create index if not exists trip_notes_trip_idx on trip_notes(trip_id, updated_at desc);
create table if not exists trip_links (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references trips(id) on delete cascade,
  title text not null, url text not null, created_by uuid references users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists trip_links_trip_idx on trip_links(trip_id, created_at desc);
create table if not exists trip_photos (
  id uuid primary key default gen_random_uuid(), trip_id uuid not null references trips(id) on delete cascade,
  url text not null, caption text, created_by uuid references users(id) on delete set null, created_at timestamptz not null default now()
);
create index if not exists trip_photos_trip_idx on trip_photos(trip_id, created_at desc);
