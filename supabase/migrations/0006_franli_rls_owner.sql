-- ============================================================
-- franli — RLS por propietario (usuario autenticado)
-- Cada registro pertenece a quien lo creó (created_by = auth.uid()).
-- Las tablas sin created_by determinan su dueño por relación.
-- ============================================================

-- ------------------------------------------------------------
-- 1) Propiedad del catálogo de productos
-- ------------------------------------------------------------

alter table franli_products
  add column created_by uuid references auth.users(id) default auth.uid();

-- Backfill: las filas existentes pasan al primer usuario registrado
-- (el dueño, ya que la app es de una persona).
update franli_products
set created_by = (select id from auth.users order by created_at limit 1)
where created_by is null;

alter table franli_products
  alter column created_by set not null;

-- ------------------------------------------------------------
-- 2) Reemplazar las policies permisivas por policies por dueño
-- ------------------------------------------------------------

drop policy "authenticated_all" on franli_products;
drop policy "authenticated_all" on franli_product_prices;
drop policy "authenticated_all" on franli_sales;
drop policy "authenticated_all" on franli_sale_items;
drop policy "authenticated_all" on franli_expenses;
drop policy "authenticated_all" on franli_cash_movements;

-- Catálogo: dueño directo
create policy "owner_all" on franli_products
  for all to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Precios: dueño vía el producto
create policy "owner_all" on franli_product_prices
  for all to authenticated
  using (exists (
    select 1 from franli_products p
    where p.id = product_id and p.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from franli_products p
    where p.id = product_id and p.created_by = auth.uid()
  ));

-- Ventas: dueño directo
create policy "owner_all" on franli_sales
  for all to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Items de venta: dueño vía la venta
create policy "owner_all" on franli_sale_items
  for all to authenticated
  using (exists (
    select 1 from franli_sales s
    where s.id = sale_id and s.created_by = auth.uid()
  ))
  with check (exists (
    select 1 from franli_sales s
    where s.id = sale_id and s.created_by = auth.uid()
  ));

-- Gastos: dueño directo
create policy "owner_all" on franli_expenses
  for all to authenticated
  using (created_by = auth.uid())
  with check (created_by = auth.uid());

-- Movimientos de caja: dueño directo; y si referencian una venta o
-- gasto, esas referencias también deben pertenecer al dueño (evita
-- referencias cruzadas hacia datos de otro usuario).
create policy "owner_all" on franli_cash_movements
  for all to authenticated
  using (created_by = auth.uid())
  with check (
    created_by = auth.uid()
    and (sale_id is null or exists (
      select 1 from franli_sales s
      where s.id = sale_id and s.created_by = auth.uid()
    ))
    and (expense_id is null or exists (
      select 1 from franli_expenses e
      where e.id = expense_id and e.created_by = auth.uid()
    ))
  );
