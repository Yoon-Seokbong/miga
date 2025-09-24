import prisma from '@/lib/prisma';
import { notFound } from 'next/navigation';
import ManualRegistrationClient from './ManualRegistrationClient';

interface ManualRegistrationPageProps {
  params: {
    id: string;
  };
}

export default async function ManualRegistrationPage({ params }: ManualRegistrationPageProps) {
  const { id } = params;

  const product = await prisma.sourcedProduct.findUnique({
    where: { id },
  });

  if (!product) {
    notFound();
  }

  // The fetched product object is serialized by Next.js, so we ensure it's plain JSON.
  // Prisma Decimal types, Dates, etc., need to be converted to strings or numbers.
  const serializableProduct = {
    ...product,
    localPrice: product.localPrice ?? 0,
    images: product.images as any, // Cast to any to avoid serialization issues with JsonValue
    videos: product.videos as any,
    attributes: product.attributes as any,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };

  return (
    <div className="p-4 sm:p-6">
      <h1 className="text-2xl font-bold mb-4">상품 수동 등록 지원</h1>
      <p className="mb-6 text-gray-600">아래 정보를 복사하여 스마트스토어, 쿠팡 등 원하는 플랫폼에 직접 붙여넣으세요.</p>
      <ManualRegistrationClient product={serializableProduct} />
    </div>
  );
}
