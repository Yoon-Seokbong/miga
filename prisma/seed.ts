// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Start seeding...');

  // Create Admin User
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  const adminUser = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { password: hashedPassword, role: 'ADMIN' },
    create: {
      email: adminEmail,
      name: 'Admin User',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`Created/updated admin user with email: ${adminUser.email}`);

  // Create Categories
  const categoriesData = [
    { name: '전자제품' },
    { name: '의류' },
    { name: '도서' },
    { name: '식품' },
    { name: '가구' },
  ];

  for (const categoryData of categoriesData) {
    await prisma.category.upsert({
      where: { name: categoryData.name },
      update: {},
      create: categoryData,
    });
  }
  console.log('Seeded categories.');

  // Fetch created categories to link products
  const electronics = await prisma.category.findUnique({ where: { name: '전자제품' } });
  const clothing = await prisma.category.findUnique({ where: { name: '의류' } });
  const books = await prisma.category.findUnique({ where: { name: '도서' } });

  // Create Products
  const productsData = [
    {
      name: '스마트폰',
      description: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '최신 스마트폰입니다.' } }] }),
      price: 1200.00,
      stock: 100,
      brand: 'ABC',
      tags: '스마트폰, 휴대폰, 전자',
      categoryId: electronics?.id,
      images: [{ url: '/placeholder-product.png' }],
      videos: [{ url: 'https://www.youtube.com/embed/dQw4w9WgXcQ' }], // Placeholder video
    },
    {
      name: '노트북',
      description: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '고성능 노트북입니다.' } }] }),
      price: 1500.00,
      stock: 50,
      brand: 'XYZ',
      tags: '노트북, 컴퓨터, 전자',
      categoryId: electronics?.id,
      images: [{ url: '/placeholder-product.png' }],
    },
    {
      name: '티셔츠',
      description: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '편안한 면 티셔츠입니다.' } }] }),
      price: 25.00,
      stock: 200,
      brand: 'FashionCo',
      tags: '티셔츠, 의류, 면',
      categoryId: clothing?.id,
      images: [{ url: '/placeholder-product.png' }],
    },
    {
      name: '소설책',
      description: JSON.stringify({ blocks: [{ type: 'paragraph', data: { text: '베스트셀러 소설입니다.' } }] }),
      price: 15.00,
      stock: 300,
      brand: 'Bookworm',
      tags: '소설, 책, 문학',
      categoryId: books?.id,
      images: [{ url: '/placeholder-product.png' }],
    },
  ];

  for (const productData of productsData) {
    const { images, videos, ...rest } = productData;

    await prisma.product.upsert({
      where: { name: rest.name },
      update: {
        ...rest,
        images: {
          create: images ? images.map(img => ({ url: `/placeholder-product-${productData.name.toLowerCase().replace(/\s/g, '-')}-${Math.random().toString(36).substring(2, 7)}.png` })) : [],
        },
        videos: {
          create: videos ? videos.map(vid => ({ url: `https://www.youtube.com/embed/dQw4w9WgXcQ?product=${productData.name.toLowerCase().replace(/\s/g, '-')}&rand=${Math.random().toString(36).substring(2, 7)}` })) : [],
        },
      },
      create: {
        ...rest,
        images: {
          create: images ? images.map(img => ({ url: `/placeholder-product-${productData.name.toLowerCase().replace(/\s/g, '-')}-${Math.random().toString(36).substring(2, 7)}.png` })) : [],
        },
        videos: {
          create: videos ? videos.map(vid => ({ url: `https://www.youtube.com/embed/dQw4w9WgXcQ?product=${productData.name.toLowerCase().replace(/\s/g, '-')}&rand=${Math.random().toString(36).substring(2, 7)}` })) : [],
        },
      },
    });
  }
  console.log('Seeded products.');

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
