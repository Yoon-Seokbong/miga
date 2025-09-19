
import { notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

// Type definitions
interface Product {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
}

interface Category {
  id: string;
  name: string;
}

// Data fetching functions
async function getCategory(categoryId: string): Promise<Category | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/categories/${categoryId}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return res.json();
  } catch (error) {
    console.error('Failed to fetch category', error);
    return null;
  }
}

async function getProducts(categoryId: string): Promise<Product[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products?categoryId=${categoryId}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (error) {
    console.error('Failed to fetch products', error);
    return [];
  }
}

// The Page Component
export default async function CategoryPage({ params }: { params: { categoryId: string } }) {
  const { categoryId } = params;

  // Fetch data in parallel
  const [category, products] = await Promise.all([
    getCategory(categoryId),
    getProducts(categoryId),
  ]);

  // If category doesn't exist, show 404
  if (!category) {
    notFound();
  }

  return (
    <div className="container mx-auto px-4">
      <h1 className="text-3xl font-bold my-8">{category.name}</h1>
      
      {products.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
          {products.map((product) => (
            <Link href={`/products/${product.id}`} key={product.id} className="group block border rounded-lg overflow-hidden shadow-sm hover:shadow-lg transition-shadow duration-300">
              <div className="relative w-full h-64 bg-gray-200">
                {product.images && product.images.length > 0 ? (
                  <Image
                    src={product.images[0].url}
                    alt={product.name}
                    layout="fill"
                    objectFit="cover"
                    className="group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-500">No Image</div>
                )}
              </div>
              <div className="p-4">
                <h2 className="text-lg font-semibold text-gray-800 truncate group-hover:text-indigo-600">{product.name}</h2>
                <p className="text-md font-bold text-gray-900 mt-2">{new Intl.NumberFormat('ko-KR').format(product.price)}원</p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-lg text-gray-600">이 카테고리에는 아직 상품이 없습니다.</p>
        </div>
      )}
    </div>
  );
}
