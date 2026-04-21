create table if not exists site_settings (
  id text primary key,
  shopping_enabled boolean not null default false,
  updated_at timestamptz default now()
);

insert into site_settings (id, shopping_enabled)
values ('storefront', false)
on conflict (id) do nothing;

alter table site_settings enable row level security;

drop policy if exists "Public read site settings" on site_settings;
create policy "Public read site settings"
  on site_settings for select
  using (true);

drop policy if exists "Admin manage site settings" on site_settings;
create policy "Admin manage site settings"
  on site_settings for all
  using (public.is_admin())
  with check (public.is_admin());

drop trigger if exists trg_site_settings_updated on site_settings;
create trigger trg_site_settings_updated
  before update on site_settings
  for each row execute function public.set_updated_at();