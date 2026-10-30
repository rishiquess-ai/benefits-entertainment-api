-- Rebuild tenant_databases so "id" is the first column. Postgres can't reorder
-- columns in place, so the rows are copied into a new table and swapped in.
-- Constraint and index names match what Prisma generates.

-- CreateTable
CREATE TABLE "tenant_databases_new" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "db_host" VARCHAR(255) NOT NULL,
    "db_port" INTEGER NOT NULL DEFAULT 5432,
    "db_name" VARCHAR(100) NOT NULL,
    "db_username" VARCHAR(100) NOT NULL,
    "db_password_enc" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_databases_new_pkey" PRIMARY KEY ("id")
);

-- CopyData
INSERT INTO "tenant_databases_new" ("id", "tenant_id", "db_host", "db_port", "db_name", "db_username", "db_password_enc", "created_at", "updated_at")
SELECT "id", "tenant_id", "db_host", "db_port", "db_name", "db_username", "db_password_enc", "created_at", "updated_at"
FROM "tenant_databases";

-- SwapTables
DROP TABLE "tenant_databases";
ALTER TABLE "tenant_databases_new" RENAME TO "tenant_databases";
ALTER TABLE "tenant_databases" RENAME CONSTRAINT "tenant_databases_new_pkey" TO "tenant_databases_pkey";

-- CreateIndex
CREATE UNIQUE INDEX "tenant_databases_tenant_id_key" ON "tenant_databases"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_databases" ADD CONSTRAINT "tenant_databases_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
