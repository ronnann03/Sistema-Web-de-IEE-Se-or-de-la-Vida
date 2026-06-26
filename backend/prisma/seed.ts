import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("admin123", 10);
  const fechaEjemplo = new Date("2026-06-25T07:35:00-05:00");

  const admin = await prisma.usuario.upsert({
    where: { email: "admin@iee.com" },
    update: { nombre: "Administrador", rol: "ADMIN" },
    create: {
      nombre: "Administrador",
      email: "admin@iee.com",
      password,
      rol: "ADMIN",
    },
  });

  const practicante = await prisma.miembro.upsert({
    where: { dni: "70000001" },
    update: {},
    create: {
      nombre: "Lucia",
      apellido: "Quispe Ramos",
      dni: "70000001",
      fechaNacimiento: new Date("2003-04-12"),
      genero: "FEMENINO",
      telefono: "987654321",
      direccion: "Av. Los Educadores 123",
      cargo: "Practicante de Sistemas",
      area: "Administracion",
      fechaIngreso: new Date("2026-06-01"),
      tipoContrato: "PRACTICANTE",
      sueldo: 0,
      estado: "ACTIVO",
    },
  });

  const docente = await prisma.miembro.upsert({
    where: { dni: "70000002" },
    update: {},
    create: {
      nombre: "Carlos",
      apellido: "Mendoza Flores",
      dni: "70000002",
      fechaNacimiento: new Date("1988-09-25"),
      genero: "MASCULINO",
      telefono: "987654322",
      direccion: "Jr. San Martin 456",
      cargo: "Docente de Matematica",
      area: "Secundaria",
      fechaIngreso: new Date("2024-03-01"),
      tipoContrato: "PLANILLA",
      sueldo: 2500,
      estado: "ACTIVO",
    },
  });

  const administrativo = await prisma.miembro.upsert({
    where: { dni: "70000003" },
    update: {},
    create: {
      nombre: "Rosa",
      apellido: "Vargas Soto",
      dni: "70000003",
      fechaNacimiento: new Date("1995-01-18"),
      genero: "FEMENINO",
      telefono: "987654323",
      direccion: "Calle Primavera 789",
      cargo: "Asistente Administrativa",
      area: "Administracion",
      fechaIngreso: new Date("2025-08-15"),
      tipoContrato: "HONORARIOS",
      sueldo: 1800,
      estado: "ACTIVO",
    },
  });

  await prisma.usuario.upsert({
    where: { email: "lucia.practicante@iee.com" },
    update: { nombre: "Lucia Quispe", rol: "ESTANDAR", miembroId: practicante.id },
    create: {
      nombre: "Lucia Quispe",
      email: "lucia.practicante@iee.com",
      password,
      rol: "ESTANDAR",
      miembroId: practicante.id,
    },
  });

  const horario = await prisma.horario.upsert({
    where: { id: "horario-general-manana" },
    update: {},
    create: {
      id: "horario-general-manana",
      nombre: "Ingreso general manana",
      descripcion: "Horario de referencia para ingreso laboral",
      diasSemana: [1, 2, 3, 4, 5],
      hora: "07:30",
      miembros: {
        create: [
          { miembroId: practicante.id },
          { miembroId: docente.id },
          { miembroId: administrativo.id },
        ],
      },
    },
  });

  await prisma.horarioMiembro.createMany({
    data: [
      { horarioId: horario.id, miembroId: practicante.id },
      { horarioId: horario.id, miembroId: docente.id },
      { horarioId: horario.id, miembroId: administrativo.id },
    ],
    skipDuplicates: true,
  });

  const sesion = await prisma.sesion.upsert({
    where: { id: "sesion-ejemplo-entrada" },
    update: { fecha: fechaEjemplo },
    create: {
      id: "sesion-ejemplo-entrada",
      horarioId: horario.id,
      fecha: fechaEjemplo,
      descripcion: "Ejemplo de asistencia diaria",
    },
  });

  await prisma.asistencia.upsert({
    where: { id: "asistencia-ejemplo-practicante" },
    update: { fecha: fechaEjemplo },
    create: {
      id: "asistencia-ejemplo-practicante",
      miembroId: practicante.id,
      sesionId: sesion.id,
      fecha: fechaEjemplo,
      tipo: "PRESENTE",
      observacion: "Entrada marcada por usuario",
    },
  });

  await prisma.asistencia.upsert({
    where: { id: "asistencia-ejemplo-docente" },
    update: { fecha: fechaEjemplo },
    create: {
      id: "asistencia-ejemplo-docente",
      miembroId: docente.id,
      sesionId: sesion.id,
      fecha: fechaEjemplo,
      tipo: "TARDANZA",
      observacion: "Ingreso despues de la hora",
    },
  });

  await prisma.asistencia.upsert({
    where: { id: "asistencia-ejemplo-administrativo" },
    update: { fecha: fechaEjemplo },
    create: {
      id: "asistencia-ejemplo-administrativo",
      miembroId: administrativo.id,
      sesionId: sesion.id,
      fecha: fechaEjemplo,
      tipo: "PRESENTE",
      observacion: "Entrada marcada por administracion",
    },
  });

  await prisma.documento.upsert({
    where: { id: "doc-practicante-cv" },
    update: {},
    create: {
      id: "doc-practicante-cv",
      miembroId: practicante.id,
      nombre: "CV Lucia Quispe",
      tipoDoc: "CV",
      url: "/uploads/ejemplo-cv.pdf",
      tamano: 125000,
    },
  });

  console.log("Seed completado:", {
    admin: admin.email,
    usuarioEstandar: "lucia.practicante@iee.com",
    password: "admin123",
    sesion: sesion.id,
  });
}

main()
  .catch((e) => {
    console.error("Error durante el seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
