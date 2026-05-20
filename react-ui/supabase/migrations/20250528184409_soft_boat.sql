-- Create vehicle_history table
create table if not exists public.vehicle_history (
  id uuid not null default gen_random_uuid() primary key,
  driver_name text not null,
  phone_number text not null,
  license_plate text not null,
  make text not null,
  model text not null,
  color text not null,
  user_id uuid not null references public.users(id),
  created_at timestamptz not null default now()
);

-- Add RLS policies
alter table public.vehicle_history enable row level security;

create policy "Users can view their own vehicle history"
  on public.vehicle_history
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert their own vehicle history"
  on public.vehicle_history
  for insert
  to authenticated
  with check (auth.uid() = user_id);

-- Create unique index on license plate per user
create unique index vehicle_history_license_plate_user_id_idx 
  on public.vehicle_history (license_plate, user_id);