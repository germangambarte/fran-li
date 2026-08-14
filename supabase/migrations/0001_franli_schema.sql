-- ============================================================
-- franli — esquema del negocio (prefijo: franli_)
-- Las tablas se comparten con otras apps del mismo proyecto de
-- Supabase (cupo free), por eso cada una lleva el prefijo franli_.
-- ============================================================

-- ------------------------------------------------------------
-- PRODUCTOS
-- Un producto puede tener precio por kilo (base) y/o varias
-- modalidades/promociones de precio (franli_product_prices).
-- ------------------------------------------------------------

create table franli_products (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) > 0),
  -- Precio base por kilo. NULL => el producto solo se vende por promociones.
  price_per_kg numeric(10,2) check (price_per_kg >= 0),
  active       boolean not null default true,
  created_at   timestamptz not null default now()
);

-- Modalidad de precio: "llevando min_kg kilos se paga price".
-- Ej.: Milanesas -> (1, 7500), (2, 13000); Pata muslo -> (3, 10000); Alitas -> (3, 7000).
-- El modelo es abierto: permite agregar cualquier producto y cualquier
-- combinacion (cantidad, precio) sin tocar el esquema.
create table franli_product_prices (
  id         uuid primary key default gen_random_uuid(),
  product_id uuid not null references franli_products(id) on delete cascade,
  min_kg     numeric(10,2) not null check (min_kg > 0),
  price      numeric(10,2) not null check (price >= 0),
  created_at timestamptz not null default now(),
  unique (product_id, min_kg)
);

-- ------------------------------------------------------------
-- VENTAS
-- ------------------------------------------------------------

create table franli_sales (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid not null references auth.users(id) default auth.uid(),
  payment_method text not null check (payment_method in ('cash', 'transfer')),
  total          numeric(10,2) not null check (total >= 0),
  created_at     timestamptz not null default now()
);

-- Detalle de venta. Guarda snapshots (product_name, unit_price) para
-- que el historial conserve el precio aplicado aunque el catalogo
-- cambie posteriormente.
create table franli_sale_items (
  id           uuid primary key default gen_random_uuid(),
  sale_id      uuid not null references franli_sales(id) on delete cascade,
  product_id   uuid references franli_products(id) on delete set null,
  product_name text not null,
  unit_price   numeric(10,2) not null check (unit_price >= 0), -- precio efectivo por kg
  quantity     numeric(10,2) not null check (quantity > 0),    -- kilos vendidos
  subtotal     numeric(10,2) not null check (subtotal >= 0)
);

-- ------------------------------------------------------------
-- GASTOS
-- ------------------------------------------------------------

create table franli_expenses (
  id             uuid primary key default gen_random_uuid(),
  created_by     uuid not null references auth.users(id) default auth.uid(),
  description    text not null check (char_length(description) > 0),
  amount         numeric(10,2) not null check (amount > 0),
  payment_method text not null check (payment_method in ('cash', 'transfer')),
  created_at     timestamptz not null default now()
);

-- ------------------------------------------------------------
-- MOVIMIENTOS DE CAJA
-- Ledger de la caja: apertura, ventas en efectivo, gastos en
-- efectivo, ingresos/egresos manuales y cierre del dia.
-- ------------------------------------------------------------

create table franli_cash_movements (
  id          uuid primary key default gen_random_uuid(),
  created_by  uuid not null references auth.users(id) default auth.uid(),
  type        text not null check (type in ('opening', 'sale', 'expense', 'cash_in', 'cash_out', 'closing')),
  amount      numeric(10,2) not null check (amount > 0),
  description text,
  sale_id     uuid references franli_sales(id) on delete set null,
  expense_id  uuid references franli_expenses(id) on delete set null,
  created_at  timestamptz not null default now(),
  -- Coherencia del tipo con la referencia:
  --   sale    -> obliga sale_id
  --   expense -> obliga expense_id
  --   resto   -> sin referencias
  check (
    (type = 'sale' and sale_id is not null and expense_id is null) or
    (type = 'expense' and expense_id is not null and sale_id is null) or
    (type not in ('sale', 'expense') and sale_id is null and expense_id is null)
  )
);

-- ------------------------------------------------------------
-- VISTAS
-- ------------------------------------------------------------

create view franli_daily_summary
with (security_invoker = true)
as
select
  date(created_at)          as day,
  count(*)                  as sales_count,
  coalesce(sum(total), 0)   as total
from franli_sales
group by date(created_at);

-- ------------------------------------------------------------
-- INDICES
-- ------------------------------------------------------------

create index franli_sales_created_at_idx        on franli_sales (created_at);
create index franli_sale_items_sale_id_idx      on franli_sale_items (sale_id);
create index franli_expenses_created_at_idx     on franli_expenses (created_at);
create index franli_cash_movements_created_at_idx on franli_cash_movements (created_at);
-- franli_product_prices ya tiene indice por (product_id, min_kg) via UNIQUE.

-- ------------------------------------------------------------
-- ROW LEVEL SECURITY
-- Todas las tablas son privadas: solo usuarios autenticados.
-- ------------------------------------------------------------

alter table franli_products        enable row level security;
alter table franli_product_prices  enable row level security;
alter table franli_sales           enable row level security;
alter table franli_sale_items      enable row level security;
alter table franli_expenses        enable row level security;
alter table franli_cash_movements  enable row level security;

create policy "authenticated_all" on franli_products       for all to authenticated using (true) with check (true);
create policy "authenticated_all" on franli_product_prices for all to authenticated using (true) with check (true);
create policy "authenticated_all" on franli_sales          for all to authenticated using (true) with check (true);
create policy "authenticated_all" on franli_sale_items     for all to authenticated using (true) with check (true);
create policy "authenticated_all" on franli_expenses       for all to authenticated using (true) with check (true);
create policy "authenticated_all" on franli_cash_movements for all to authenticated using (true) with check (true);
