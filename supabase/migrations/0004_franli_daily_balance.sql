-- ============================================================
-- franli — historial diario
-- Agregado en PostgreSQL: agrupa ventas y gastos por día local
-- y rellena los días sin movimientos con ceros (generate_series).
-- El rango arranca en el primer día con movimientos (máximo 30
-- días hacia atrás), así no se muestran días previos a usar la
-- app. Recibe la zona horaria del dispositivo para agrupar por
-- día local correctamente.
-- ============================================================

create or replace function franli_daily_balance(tz text)
returns table (
  day      date,
  sales    numeric(10,2),
  expenses numeric(10,2)
)
language plpgsql
security invoker
set search_path = public
as $$
declare
  first_day date;
begin
  perform set_config('timezone', tz, true);

  select coalesce(min(movements.day), current_date)
  into first_day
  from (
    select date(created_at) as day from franli_sales
    union all
    select date(created_at) as day from franli_expenses
  ) as movements;

  first_day := greatest(first_day, current_date - 29);

  return query
  with days as (
    select generate_series(first_day, current_date, interval '1 day')::date as day
  ),
  grouped as (
    select
      movements.day,
      coalesce(sum(movements.sales_total), 0)::numeric(10,2) as sales,
      coalesce(sum(movements.expenses_total), 0)::numeric(10,2) as expenses
    from (
      select date(created_at) as day, total as sales_total, null::numeric as expenses_total
      from franli_sales
      union all
      select date(created_at) as day, null::numeric as sales_total, amount as expenses_total
      from franli_expenses
    ) as movements
    group by movements.day
  )
  select
    days.day,
    coalesce(grouped.sales, 0),
    coalesce(grouped.expenses, 0)
  from days
  left join grouped on grouped.day = days.day
  order by days.day desc;
end;
$$;

revoke execute on function franli_daily_balance(text) from public;
grant execute on function franli_daily_balance(text) to authenticated;
