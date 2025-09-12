const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Deleting all sourced products...');
  const { count } = await prisma.sourcedProduct.deleteMany({});
  console.log(`Successfully deleted ${count} sourced products.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
