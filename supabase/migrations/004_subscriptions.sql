create table if not exists public.subscriptions (
  id                         uuid primary key default gen_random_uuid(),
  user_id                    uuid not null references public.profiles(id) on delete cascade,
  plan                       text not null check (plan in ('pro', 'biz')),
  status                     text not null default 'pending'
                             check (status in ('pending','active','cancelled','past_due','completed')),
  razorpay_subscription_id   text unique,
  razorpay_payment_id        text,
  current_period_start       timestamptz,
  current_period_end         timestamptz,
  created_at                 timestamptz not null default now(),
  updated_at                 timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

create policy "subscriptions_select_own"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Service role writes only (webhook handler uses service client)
create trigger subscriptions_updated_at
  before update on public.subscriptions
  for each row execute procedure public.set_updated_at();

create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_razorpay_id_idx
  on public.subscriptions(razorpay_subscription_id)
  where razorpay_subscription_id is not null;
