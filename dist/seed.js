"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    // Delete all existing data
    await prisma.orderLineItem.deleteMany({});
    await prisma.order.deleteMany({});
    await prisma.product.deleteMany({});
    await prisma.category.deleteMany({});
    await prisma.user.deleteMany({});
    // Create categories
    const electronics = await prisma.category.create({
        data: { name: 'Electronics' },
    });
    const books = await prisma.category.create({
        data: { name: 'Books' },
    });
    // Create products
    await prisma.product.create({
        data: {
            name: 'Super Fast Laptop',
            description: 'A laptop that is really, really fast.',
            price: 1200.00,
            imageUrl: 'https://via.placeholder.com/150',
            category: {
                connect: { id: electronics.id },
            },
        },
    });
    await prisma.product.create({
        data: {
            name: 'The Pragmatic Programmer',
            description: 'A classic book for any software developer.',
            price: 45.50,
            imageUrl: 'https://via.placeholder.com/150',
            category: {
                connect: { id: books.id },
            },
        },
    });
    await prisma.product.create({
        data: {
            name: 'Wireless Headphones',
            description: 'Listen to your music without any wires.',
            price: 199.99,
            imageUrl: 'https://via.placeholder.com/150',
            category: {
                connect: { id: electronics.id },
            },
        },
    });
    console.log('Seeding finished.');
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
