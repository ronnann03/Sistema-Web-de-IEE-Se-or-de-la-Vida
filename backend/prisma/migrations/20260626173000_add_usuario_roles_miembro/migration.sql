-- CreateEnum
CREATE TYPE "RolUsuario" AS ENUM ('ADMIN', 'ESTANDAR');

-- AlterTable
ALTER TABLE "Usuario" ADD COLUMN "rol" "RolUsuario" NOT NULL DEFAULT 'ESTANDAR';
ALTER TABLE "Usuario" ADD COLUMN "miembroId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_miembroId_key" ON "Usuario"("miembroId");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE SET NULL ON UPDATE CASCADE;
