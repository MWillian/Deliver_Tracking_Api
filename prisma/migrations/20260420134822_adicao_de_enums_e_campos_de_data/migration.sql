/*
  Warnings:

  - Added the required column `updated_at` to the `entregas` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `entregas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.
  - Added the required column `updated_at` to the `eventos_entrega` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `motoristas` table without a default value. This is not possible if the table is not empty.
  - Changed the type of `status` on the `motoristas` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "StatusEntrega" AS ENUM ('CRIADA', 'EM_TRANSITO', 'ENTREGUE', 'CANCELADA');

-- CreateEnum
CREATE TYPE "StatusMotorista" AS ENUM ('ATIVO', 'INATIVO');

-- AlterTable
ALTER TABLE "entregas" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "StatusEntrega" NOT NULL;

-- AlterTable
ALTER TABLE "eventos_entrega" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "motoristas" ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL,
DROP COLUMN "status",
ADD COLUMN     "status" "StatusMotorista" NOT NULL;
