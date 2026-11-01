create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create table private.allowed_accounts (
  email text primary key check (email = lower(btrim(email)) and email <> ''),
  created_at timestamptz not null default now()
);
alter table private.allowed_accounts enable row level security;
revoke all on private.allowed_accounts from public, anon, authenticated;

-- Google identity data is managed by Auth; editable user_metadata cannot grant access.
create function public.has_app_access()
returns boolean
language sql stable security definer
set search_path = ''
as $$
  select exists (
    select 1
    from auth.identities i
    join private.allowed_accounts a on a.email = lower(i.identity_data->>'email')
    where i.user_id = (select auth.uid())
      and i.provider = 'google'
      and i.identity_data->>'email_verified' = 'true'
  );
$$;
revoke all on function public.has_app_access() from public, anon;
grant execute on function public.has_app_access() to authenticated;
;
