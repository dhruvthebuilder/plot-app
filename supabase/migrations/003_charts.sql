create table if not exists public.charts (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references public.profiles(id) on delete cascade,
  brand_kit_id  uuid references public.brand_kits(id) on delete set null,
  title         text not null default 'Untitled chart',
  subtitle      text default '',
  source_text   text default '',
  chart_type    text not null default 'bar',
  raw_data      text default '',
  data_json     jsonb default '{}',
  config        jsonb not null default '{}',
  social_text   jsonb not null default '{}',
  thumbnail_url text,
  is_public     boolean not null default false,
  slug          text unique,
  view_count    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table public.charts enable row level security;

create policy "charts_manage_own"
  on public.charts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "charts_select_public"
  on public.charts for select
  using (is_public = true);

create trigger charts_updated_at
  before update on public.charts
  for each row execute procedure public.set_updated_at();

create index charts_user_id_idx on public.charts(user_id);
create index charts_user_updated_idx on public.charts(user_id, updated_at desc);
create index charts_slug_idx on public.charts(slug) where slug is not null;
create index charts_public_idx on public.charts(is_public) where is_public = true;
