-- CreateTable
CREATE TABLE "customers" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "domain" VARCHAR(255) NOT NULL,
    "customer_ref_id" INTEGER NOT NULL,
    "customer_name" VARCHAR(255) NOT NULL,
    "leaderboard_enabled_flag" BOOLEAN NOT NULL DEFAULT false,
    "active_flag" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "customers_customer_ref_id_key" ON "customers"("customer_ref_id");
