
-- Drop the trigger on billing_prices that causes the circular deadlock
DROP TRIGGER IF EXISTS prevent_active_price_if_product_inactive ON public.billing_prices;

-- Now drop the function with CASCADE to clean up
DROP FUNCTION IF EXISTS public.prevent_active_price_if_product_inactive() CASCADE;
