import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Deleting products with no category assigned...');
    const { count } = await prisma.product.deleteMany({
      where: {
        categoryId: null,
      },
    });
    console.log(`${count} products with no category were deleted.`);
  } catch (error) {
    console.error('Error deleting products:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
