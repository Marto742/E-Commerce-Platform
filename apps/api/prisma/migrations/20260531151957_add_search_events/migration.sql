-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_user_id_fkey";

-- CreateTable
CREATE TABLE "search_events" (
    "id" TEXT NOT NULL,
    "query" TEXT NOT NULL,
    "normalized" TEXT NOT NULL,
    "result_count" INTEGER NOT NULL,
    "user_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "search_events_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "search_events_normalized_idx" ON "search_events"("normalized");

-- CreateIndex
CREATE INDEX "search_events_result_count_idx" ON "search_events"("result_count");

-- CreateIndex
CREATE INDEX "search_events_created_at_idx" ON "search_events"("created_at");

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
