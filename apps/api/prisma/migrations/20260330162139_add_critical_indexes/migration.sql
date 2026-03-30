-- CreateIndex
CREATE INDEX "addresses_user_id_is_default_idx" ON "addresses"("user_id", "is_default");

-- CreateIndex
CREATE INDEX "categories_is_active_parent_id_sort_order_idx" ON "categories"("is_active", "parent_id", "sort_order");

-- CreateIndex
CREATE INDEX "orders_user_id_created_at_idx" ON "orders"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "product_variants_product_id_is_active_idx" ON "product_variants"("product_id", "is_active");

-- CreateIndex
CREATE INDEX "product_variants_is_active_stock_idx" ON "product_variants"("is_active", "stock");

-- CreateIndex
CREATE INDEX "products_is_active_category_id_idx" ON "products"("is_active", "category_id");

-- CreateIndex
CREATE INDEX "products_is_active_base_price_idx" ON "products"("is_active", "base_price");

-- CreateIndex
CREATE INDEX "products_is_active_created_at_idx" ON "products"("is_active", "created_at");
