import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const email = 'admin@iee.com';
  const newPassword = 'admin123';
  const hashed = await bcrypt.hash(newPassword, 10);

  const usuario = await prisma.usuario.update({
    where: { email },
    data: { password: hashed },
  });

  console.log(`Contraseña reseteada para: ${usuario.email}`);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
