-- CreateTable
CREATE TABLE "tenant_details" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "tenant_id" UUID NOT NULL,
    "encryption_key" TEXT NOT NULL,
    "encryption_iv" TEXT NOT NULL,
    "encryption_cipher" VARCHAR(50) NOT NULL,
    "profile_api_url" TEXT NOT NULL,
    "profile_api_token" TEXT NOT NULL,
    "redirect_back_url" TEXT NOT NULL,
    "default_leaderboard_scope" VARCHAR(50) NOT NULL,
    "app_branding" JSONB NOT NULL,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tenant_details_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tenant_details_tenant_id_key" ON "tenant_details"("tenant_id");

-- AddForeignKey
ALTER TABLE "tenant_details" ADD CONSTRAINT "tenant_details_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
