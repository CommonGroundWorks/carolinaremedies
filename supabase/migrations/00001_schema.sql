-- Carolina Remedies – Supabase Schema Migration
-- Run via Supabase Dashboard → SQL Editor, or `supabase db push`

-- Enable UUID generation
create extension if not exists "pgcrypto";

-- ─────────────────────────────────────────────
-- Categories
-- ─────────────────────────────────────────────
create table if not exists categories (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  parent_id     uuid references categories(id),
  level         int default 0,
  sort_order    int default 0,
  icon          text,
  image_url     text,
  color_hex     text,
  is_featured   boolean default false,
  meta_title    text,
  meta_description text,
  is_active     boolean default true,
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

create index if not exists idx_categories_parent on categories(parent_id);

-- ─────────────────────────────────────────────
-- Products
-- ─────────────────────────────────────────────
create table if not exists products (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  sku                 text not null unique,
  category_id         uuid not null references categories(id),
  subcategory         text,
  description         text,
  short_description   text,
  brand               text,
  genetics            text,
  strain_type         text not null,
  thc_percentage      double precision,
  cbd_percentage      double precision,
  total_cannabinoids  double precision,
  terpene_profile     jsonb,
  base_price          double precision not null,
  currency            text default 'USD',
  status              text not null default 'active',
  is_featured         boolean default false,
  is_new_arrival      boolean default false,
  is_bestseller       boolean default false,
  is_lab_tested       boolean default false,
  is_organic          boolean default false,
  lab_results_url     text,
  meta_title          text,
  meta_description    text,
  meta_keywords       text,
  farm_bill_compliant boolean default true,
  age_restricted      boolean default true,
  license_number      text,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now(),
  published_at        timestamptz,
  discontinued_at     timestamptz,
  created_by          uuid,
  updated_by          uuid
);

create index if not exists idx_products_category on products(category_id);
create index if not exists idx_products_slug     on products(slug);
create index if not exists idx_products_status   on products(status);

-- ─────────────────────────────────────────────
-- Product Variants (weight-based pricing)
-- ─────────────────────────────────────────────
create table if not exists product_variants (
  id                  uuid primary key default gen_random_uuid(),
  product_id          uuid not null references products(id) on delete cascade,
  name                text not null,
  weight_value        double precision,
  weight_unit         text not null default 'g',
  price               double precision not null,
  cost                double precision,
  compare_at_price    double precision,
  sku                 text,
  barcode             text,
  inventory_quantity  int default 0,
  inventory_policy    text default 'deny',
  low_stock_threshold int default 5,
  requires_shipping   boolean default true,
  weight_grams        double precision,
  is_active           boolean default true,
  position            int default 0,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index if not exists idx_variants_product on product_variants(product_id);

-- ─────────────────────────────────────────────
-- Product Images
-- ─────────────────────────────────────────────
create table if not exists product_images (
  id                uuid primary key default gen_random_uuid(),
  product_id        uuid not null references products(id) on delete cascade,
  filename          text not null,
  original_filename text,
  url               text not null,
  alt_text          text,
  width             int,
  height            int,
  file_size         int,
  mime_type         text,
  image_type        text default 'product',
  position          int default 0,
  is_primary        boolean default false,
  created_at        timestamptz default now()
);

create index if not exists idx_images_product on product_images(product_id);

-- ─────────────────────────────────────────────
-- Effects
-- ─────────────────────────────────────────────
create table if not exists effects (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  category    text not null,
  icon        text,
  color_hex   text,
  created_at  timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Product ↔ Effect join table
-- ─────────────────────────────────────────────
create table if not exists product_effects (
  product_id uuid not null references products(id) on delete cascade,
  effect_id  uuid not null references effects(id) on delete cascade,
  intensity  int default 3,
  primary key (product_id, effect_id)
);

-- ─────────────────────────────────────────────
-- Orders
-- ─────────────────────────────────────────────
create table if not exists orders (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid,
  email          text not null,
  first_name     text,
  last_name      text,
  phone          text,
  address_line1  text,
  address_line2  text,
  city           text,
  state          text,
  postal_code    text,
  status         text default 'pending',
  total_amount   double precision not null,
  subtotal       double precision,
  tax_amount     double precision,
  shipping_amount double precision,
  discount_amount double precision,
  payment_method text default 'COD',
  order_number   text unique,
  notes          text,
  created_at     timestamptz default now(),
  updated_at     timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Order Items
-- ─────────────────────────────────────────────
create table if not exists order_items (
  id           uuid primary key default gen_random_uuid(),
  order_id     uuid not null references orders(id) on delete cascade,
  variant_id   uuid,
  product_name text not null,
  variant_name text not null,
  price        double precision not null,
  quantity     int not null,
  created_at   timestamptz default now()
);

-- ─────────────────────────────────────────────
-- Inventory tracking (for admin alerts)
-- ─────────────────────────────────────────────
create table if not exists inventory_logs (
  id           uuid primary key default gen_random_uuid(),
  variant_id   uuid not null references product_variants(id) on delete cascade,
  change       int not null,
  reason       text,
  created_by   uuid,
  created_at   timestamptz default now()
);

-- ═══════════════════════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════════════════════

-- Enable RLS on every table
alter table categories       enable row level security;
alter table products         enable row level security;
alter table product_variants enable row level security;
alter table product_images   enable row level security;
alter table effects          enable row level security;
alter table product_effects  enable row level security;
alter table orders           enable row level security;
alter table order_items      enable row level security;
alter table inventory_logs   enable row level security;

-- ── Helper: check if the current JWT has admin role ──
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(
    (auth.jwt() -> 'user_metadata' ->> 'is_admin')::boolean,
    false
  );
$$;

-- ─── Categories ───
create policy "Public read categories"
  on categories for select
  using (true);

create policy "Admin manage categories"
  on categories for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Products ───
create policy "Public read active products"
  on products for select
  using (status in ('active', 'published'));

create policy "Admin manage products"
  on products for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Product Variants ───
create policy "Public read variants"
  on product_variants for select
  using (true);

create policy "Admin manage variants"
  on product_variants for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Product Images ───
create policy "Public read images"
  on product_images for select
  using (true);

create policy "Admin manage images"
  on product_images for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Effects ───
create policy "Public read effects"
  on effects for select
  using (true);

create policy "Admin manage effects"
  on effects for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Product Effects ───
create policy "Public read product_effects"
  on product_effects for select
  using (true);

create policy "Admin manage product_effects"
  on product_effects for all
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Orders ───
create policy "Admin read all orders"
  on orders for select
  using (public.is_admin());

create policy "Users read own orders"
  on orders for select
  using (auth.uid() = user_id);

create policy "Anyone can create orders (COD)"
  on orders for insert
  with check (true);

create policy "Admin manage orders"
  on orders for update
  using (public.is_admin())
  with check (public.is_admin());

-- ─── Order Items ───
create policy "Admin read all order items"
  on order_items for select
  using (public.is_admin());

create policy "Users read own order items"
  on order_items for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_items.order_id
        and orders.user_id = auth.uid()
    )
  );

create policy "Anyone can create order items"
  on order_items for insert
  with check (true);

-- ─── Inventory Logs ───
create policy "Admin manage inventory logs"
  on inventory_logs for all
  using (public.is_admin())
  with check (public.is_admin());

-- ═══════════════════════════════════════════════
-- Updated-at trigger
-- ═══════════════════════════════════════════════
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_categories_updated       before update on categories       for each row execute function public.set_updated_at();
create trigger trg_products_updated         before update on products         for each row execute function public.set_updated_at();
create trigger trg_product_variants_updated before update on product_variants for each row execute function public.set_updated_at();
create trigger trg_orders_updated           before update on orders           for each row execute function public.set_updated_at();
