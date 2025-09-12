const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('새로운 테스트 주문 생성을 시작합니다...');

  // 1. 이메일로 관리자 유저를 찾습니다.
  const adminUser = await prisma.user.findUnique({
    where: { email: 'admin@example.com' },
  });

  if (!adminUser) {
    console.error("admin@example.com 이메일을 가진 관리자 유저를 찾을 수 없습니다. 먼저 'npx prisma db seed'를 실행했는지 확인하세요.");
    return;
  }
  const userId = adminUser.id;
  console.log(`관리자 유저를 찾았습니다. ID: ${userId}`);

  // 2. 이름으로 테스트할 상품을 찾습니다.
  const productName = '스마트폰';
  const product = await prisma.product.findUnique({
    where: { name: productName },
  });

  if (!product) {
    console.error(`'${productName}' 상품을 찾을 수 없습니다. 데이터베이스가 정상적으로 시드되었는지 확인하세요.`);
    return;
  }
  const productId = product.id;
  console.log(`상품을 찾았습니다: ${product.name}, ID: ${productId}, 가격: ${product.price}`);

  const quantity = 1;
  const total = product.price * quantity;

  // 3. 동적으로 찾은 ID를 사용하여 주문을 생성합니다.
  const newOrder = await prisma.order.create({
    data: {
      userId: userId, // 동적 ID 사용
      total: total,
      status: 'PAID',
      shippingAddress: '테스트 주소, 테스트시, 테스트동 123',
      paymentMethod: '테스트 결제',
      tossOrderId: `test_order_${new Date().getTime()}`,
      lineItems: {
        create: {
          productId: productId, // 동적 ID 사용
          quantity: quantity,
          price: product.price,
        },
      },
    },
    include: {
      lineItems: true,
    },
  });

  console.log('테스트 주문을 성공적으로 생성했습니다!');
  console.log(JSON.stringify(newOrder, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });