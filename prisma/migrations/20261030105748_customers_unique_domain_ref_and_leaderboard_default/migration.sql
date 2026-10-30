-- DropIndex
DROP INDEX "customers_customer_ref_id_key";

-- AlterTable
ALTER TABLE "customers" ALTER COLUMN "leaderboard_enabled_flag" SET DEFAULT true;

-- CreateIndex
CREATE UNIQUE INDEX "customers_domain_customer_ref_id_key" ON "customers"("domain", "customer_ref_id");
