-- ============================================================
-- franli — movimientos de caja: observación opcional
-- ============================================================

alter table franli_cash_movements
  add column note text;
