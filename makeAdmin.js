import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const userEmail = 'aaa@aaa.com';

  try {
    console.log(`Attempting to make user ${userEmail} an ADMIN...`);

    const updatedUser = await prisma.user.update({
      where: { email: userEmail },
      data: { role: 'ADMIN' },
    });

    console.log(`User ${updatedUser.email} is now an ${updatedUser.role}.`);
  } catch (error) {
    console.error('Error making user admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
