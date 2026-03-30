-- ENCHO Space production foundation schema (v1)
-- PostgreSQL 15+

create extension if not exists pgcrypto;

create type user_role as enum ('guest','host_individual','admin_support','admin_ops','admin_finance','super_admin');
create type verification_status as enum ('unverified','pending','verified','rejected');
create type listing_status as enum ('draft','pending_review','approved','rejected','published','unpublished');
create type booking_mode as enum ('request_to_book','instant_book','manual_approval');
create type payment_mode as enum ('full_upfront','deposit_plus_balance','pay_later');
create type stay_mode as enum ('long_stay_only','short_stay_only','both');
create type booking_status as enum ('draft','requested','approved','rejected','payment_pending','payment_authorized','confirmed','payment_failed','cancelled_by_guest','cancelled_by_host','completed');
create type txn_type as enum ('charge','refund','payout','fee');
create type txn_status as enum ('pending','succeeded','failed','cancelled');

create table users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  phone text unique,
  password_hash text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table user_role_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  role user_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);

create table hosts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique not null references users(id) on delete cascade,
  display_name text not null,
  verification_status verification_status not null default 'unverified',
  trust_score numeric(5,2) not null default 0,
  payout_account_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table properties (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references hosts(id) on delete cascade,
  title text not null,
  description text,
  city text not null,
  country text not null,
  latitude numeric(10,7),
  longitude numeric(10,7),
  status listing_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  unit_name text not null,
  unit_type text not null,
  bedrooms int,
  bathrooms int,
  area_sqft int,
  max_guests int,
  base_price numeric(12,2) not null,
  currency char(3) not null default 'USD',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table listing_policies (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid unique not null references units(id) on delete cascade,
  booking_mode booking_mode not null default 'request_to_book',
  payment_mode payment_mode not null default 'full_upfront',
  stay_mode stay_mode not null default 'long_stay_only',
  min_stay_nights int not null default 30,
  max_stay_nights int,
  deposit_percent numeric(5,2),
  balance_due_days_before_checkin int,
  cancellation_policy_key text not null default 'standard',
  instant_book_enabled boolean not null default false,
  pay_later_enabled boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  host_id uuid not null references hosts(id),
  guest_user_id uuid not null references users(id),
  check_in date not null,
  check_out date not null,
  total_amount numeric(12,2) not null,
  currency char(3) not null,
  booking_mode booking_mode not null,
  payment_mode payment_mode not null,
  status booking_status not null default 'payment_pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table payment_transactions (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id),
  type txn_type not null,
  status txn_status not null,
  amount numeric(12,2) not null,
  currency char(3) not null,
  provider_txn_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table admin_policy_overrides (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id) on delete cascade,
  force_booking_mode booking_mode,
  force_payment_mode payment_mode,
  force_stay_mode stay_mode,
  allow_instant_book boolean,
  allow_pay_later boolean,
  reason text not null,
  active boolean not null default true,
  created_by uuid not null references users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table admin_actions (
  id uuid primary key default gen_random_uuid(),
  admin_user_id uuid not null references users(id),
  action_key text not null,
  target_type text not null,
  target_id uuid not null,
  before_data jsonb,
  after_data jsonb,
  reason text,
  created_at timestamptz not null default now()
);

create index idx_properties_geo on properties(latitude, longitude);
create index idx_bookings_guest on bookings(guest_user_id);
create index idx_bookings_host on bookings(host_id);
create index idx_admin_actions_target on admin_actions(target_type, target_id);
