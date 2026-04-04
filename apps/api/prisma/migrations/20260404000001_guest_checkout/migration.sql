-- AlterTable: make user_id nullable and add guest_email
ALTER TABLE "orders" ALTER COLUMN "user_id" DROP NOT NULL;
ALTER TABLE "orders" ADD COLUMN "guest_email" TEXT;
