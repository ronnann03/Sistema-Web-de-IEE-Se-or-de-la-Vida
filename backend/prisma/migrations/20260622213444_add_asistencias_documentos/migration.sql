-- CreateEnum
CREATE TYPE "TipoAsistencia" AS ENUM ('PRESENTE', 'AUSENTE', 'TARDANZA', 'PERMISO');

-- CreateTable
CREATE TABLE "Asistencia" (
    "id" TEXT NOT NULL,
    "miembroId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "tipo" "TipoAsistencia" NOT NULL DEFAULT 'PRESENTE',
    "observacion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Asistencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Documento" (
    "id" TEXT NOT NULL,
    "miembroId" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "tipoDoc" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "tamano" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Asistencia" ADD CONSTRAINT "Asistencia_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_miembroId_fkey" FOREIGN KEY ("miembroId") REFERENCES "Miembro"("id") ON DELETE CASCADE ON UPDATE CASCADE;
