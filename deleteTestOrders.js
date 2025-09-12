import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    const testUserId = 'cmeij48wf0000wdggu3iabhnw'; // Replace with the actual test user ID if different

    console.log(`Deleting all orders and their line items for test user: ${testUserId}...`);

    // Delete OrderLineItems first (due to foreign key constraint)
    const deletedLineItems = await prisma.orderLineItem.deleteMany({
      where: {
        order: {
          userId: testUserId,
        },
      },
    });
    console.log(`Deleted ${deletedLineItems.count} order line items.`);

    // Then delete the Orders
    const deletedOrders = await prisma.order.deleteMany({
      where: {
        userId: testUserId,
      },
    });
    console.log(`Deleted ${deletedOrders.count} orders.`);

    console.log('Test orders cleanup complete.');
  } catch (error) {
    console.error('Error deleting test orders:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
