-- CreateTable
CREATE TABLE "players" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "customer_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "player_id" VARCHAR(100) NOT NULL,
    "player_reference_id" VARCHAR(100) NOT NULL,
    "display_name" VARCHAR(255) NOT NULL,
    "contact_no" VARCHAR(30),
    "email_id" VARCHAR(255),
    "last_login_at" TIMESTAMPTZ(6),
    "active_flag" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ(6),

    CONSTRAINT "players_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "players_customer_id_player_reference_id_key" ON "players"("customer_id", "player_reference_id");

-- AddForeignKey
ALTER TABLE "players" ADD CONSTRAINT "players_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
