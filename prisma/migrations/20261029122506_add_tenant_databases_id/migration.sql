-- AlterTable
ALTER TABLE "tenant_databases" DROP CONSTRAINT "tenant_databases_pkey",
ADD COLUMN     "id" UUID NOT NULL DEFAULT gen_random_uuid(),
ADD CONSTRAINT "tenant_databases_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "tenant_databases_tenant_id_key" ON "tenant_databases"("tenant_id");
