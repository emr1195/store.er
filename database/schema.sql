create table if not exists categories (
  id text primary key,
  revision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text,
  slug text unique,
  description text,
  image jsonb
);

create table if not exists products (
  id text primary key,
  revision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  slug text not null unique,
  images jsonb not null default '[]'::jsonb,
  intro text,
  description text,
  price numeric(12, 2) not null check (price >= 0),
  discount numeric(5, 2) not null default 0 check (discount between 0 and 100),
  stock integer not null default 0 check (stock >= 0),
  sku text,
  is_active boolean not null default true,
  taxable boolean not null default true,
  status text,
  variant text
);

create table if not exists product_categories (
  product_id text not null references products(id) on delete cascade,
  category_id text not null references categories(id) on delete cascade,
  primary key (product_id, category_id)
);

create table if not exists orders (
  id text primary key,
  revision text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  order_number text not null unique,
  invoice jsonb,
  stripe_checkout_session_id text unique,
  stripe_customer_id text,
  clerk_user_id text not null,
  customer_name text not null,
  email text not null,
  stripe_payment_intent_id text,
  total_price numeric(12, 2) not null default 0,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  tax_base_cents integer not null default 0,
  itbms_cents integer not null default 0,
  shipping_cents integer not null default 0,
  total_cents integer not null default 0,
  refunded_cents integer not null default 0,
  inventory_reserved boolean not null default false,
  checkout_attempt_id text unique,
  cancelled_at timestamptz,
  currency text not null default 'usd',
  amount_discount numeric(12, 2) not null default 0,
  status text not null,
  order_date timestamptz not null
);

create index if not exists orders_clerk_user_date_idx on orders (clerk_user_id, order_date desc);
create index if not exists orders_payment_intent_idx on orders (stripe_payment_intent_id);

create table if not exists order_items (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  product_id text,
  quantity integer not null check (quantity > 0),
  name_snapshot text not null,
  sku_snapshot text,
  variant_snapshot text,
  unit_price_cents integer not null default 0,
  subtotal_cents integer not null default 0,
  discount_cents integer not null default 0,
  itbms_cents integer not null default 0,
  total_cents integer not null default 0
);

create index if not exists order_items_order_idx on order_items (order_id);

create table if not exists order_audits (
  id text primary key,
  order_id text not null references orders(id) on delete cascade,
  actor_id text not null,
  action text not null,
  previous_status text,
  new_status text,
  created_at timestamptz not null
);

create table if not exists inventory_movements (
  id text primary key,
  product_id text not null,
  order_id text not null,
  quantity integer not null,
  reason text not null,
  created_at timestamptz not null
);

create index if not exists inventory_movements_order_idx on inventory_movements (order_id);

create table if not exists webhook_events (
  id text primary key,
  provider text not null,
  event_id text not null unique,
  event_type text not null,
  order_id text,
  processed_at timestamptz not null
);

create table if not exists data_migrations (
  id text primary key,
  source text not null,
  details jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);
