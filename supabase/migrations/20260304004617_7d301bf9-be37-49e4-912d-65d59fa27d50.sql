-- Ativar apenas produtos que JÁ têm preços ativos com stripe_price_id
UPDATE billing_products SET is_active = true 
WHERE id IN ('prod_free','prod_starter','prod_pro');