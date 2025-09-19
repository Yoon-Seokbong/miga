
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting category hierarchy migration...');

  // 1. Create the top-level parent categories
  const generalParent = await prisma.category.upsert({
    where: { name: '일반 상품' },
    update: {},
    create: { name: '일반 상품' },
  });
  console.log(`Ensured parent category exists: '${generalParent.name}'`);

  const sourcingParent = await prisma.category.upsert({
    where: { name: '구매대행 상품' },
    update: {},
    create: { name: '구매대행 상품' },
  });
  console.log(`Ensured parent category exists: '${sourcingParent.name}'`);

  // 2. Find the original '구매대행' category
  const originalSourcingCategory = await prisma.category.findUnique({
    where: { name: '구매대행' },
  });

  // 3. If it exists, assign it to the new '구매대행 상품' parent
  if (originalSourcingCategory) {
    if (!originalSourcingCategory.parentId) {
      await prisma.category.update({
        where: { id: originalSourcingCategory.id },
        data: { parentId: sourcingParent.id },
      });
      console.log(`Moved category '${originalSourcingCategory.name}' under '${sourcingParent.name}'`);
    } else {
      console.log(`Category '${originalSourcingCategory.name}' already has a parent. Skipping.`);
    }
  } else {
    console.log("Category '구매대행' not found. You may want to create it under '구매대행 상품'.");
  }

  // 4. Find all other top-level categories
  const otherTopLevelCategories = await prisma.category.findMany({
    where: {
      parentId: null, // Only select categories that are currently top-level
      id: {
        notIn: [generalParent.id, sourcingParent.id], // Exclude the new parent categories themselves
      },
    },
  });

  // 5. Move them under the '일반 상품' parent category
  for (const category of otherTopLevelCategories) {
    // We already filtered for parentId: null, but this is an extra safeguard
    if (category.id !== originalSourcingCategory?.id) { // Make sure we don't re-process the sourcing category
        await prisma.category.update({
            where: { id: category.id },
            data: { parentId: generalParent.id },
        });
        console.log(`Moved category '${category.name}' under '${generalParent.name}'`);
    }
  }

  console.log('Category migration finished successfully.');
}

main()
  .catch((e) => {
    console.error('An error occurred during migration:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
