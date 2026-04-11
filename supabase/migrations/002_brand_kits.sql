create table if not exists public.brand_kits (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  name          text not null default 'Default',
  primary_color text not null default '#1D6EE8',
  font_pair     text not null default 'syne-ibm',
  logo_url      text,
  is_default    boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.brand_kits enable row level security;

create policy "brand_kits_manage_own"
  on public.brand_kits for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create trigger brand_kits_updated_at
  before update on public.brand_kits
  for each row execute procedure public.set_updated_at();

create index brand_kits_user_id_idx on public.brand_kits(user_id);
