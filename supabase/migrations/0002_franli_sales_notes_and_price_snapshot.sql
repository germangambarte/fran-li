-- ============================================================
-- franli — ventas: observación y snapshot exacto de la modalidad
-- Las ventas históricas deben conservar el precio aplicado en
-- el momento, aun si el catalogo de precios cambia despues.
-- ============================================================

-- Observación opcional en la venta.
alter table franli_sales
  add column note text;

-- Snapshot de la modalidad aplicada en el item:
--   - modalidad "por kilo": price_min_kg y pack_price son NULL,
--     el precio efectivo esta en unit_price.
--   - modalidad "pack" (llevando X kg pagas $P): price_min_kg = X
--     y pack_price = P, conservados exactos en el momento de la venta.
alter table franli_sale_items
  add column price_min_kg numeric(10,2),
  add column pack_price numeric(10,2);

alter table franli_sale_items
  add constraint franli_sale_items_price_consistency check (
    (price_min_kg is null and pack_price is null) or
    (price_min_kg is not null and price_min_kg > 0 and pack_price is not null and pack_price >= 0)
  );
