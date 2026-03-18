-- Normalize legacy expense categories to current values.
-- "hotel" was renamed to "accommodation".
update public.expenses
set category = 'accommodation'
where category = 'hotel';
