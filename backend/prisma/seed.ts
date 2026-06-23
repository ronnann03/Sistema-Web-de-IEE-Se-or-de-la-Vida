import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@iee.com';
  const password = 'admin123';
  
  const existingUser = await prisma.usuario.findUnique({
    where: { email }
  });

  if (existingUser) {
    console.log('El usuario administrador ya existe.');
    return;
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.usuario.create({
    data: {
      nombre: 'Administrador',
      email: email,
      password: hashedPassword,
    },
  });

  console.log('Usuario administrador creado con éxito:', admin.email);
}

main()
  .catch((e) => {
    console.error('Error durante el seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
