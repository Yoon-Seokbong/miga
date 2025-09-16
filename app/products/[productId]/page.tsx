import { notFound } from 'next/navigation';
import ProductDetailClient from './ProductDetailClient';

// Define types (these should ideally be imported from a shared types file)
interface ProductImage { id: string; url: string; }
interface ProductVideo { id: string; url: string; }
interface ProductDetailImage { id: string; url: string; order: number; }
interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number;
  images: ProductImage[];
  detailImages: ProductDetailImage[];
  averageRating?: number;
  reviewCount?: number;
  relatedProducts?: Product[];
  videos?: ProductVideo[]; // Ensure videos are part of the Product type
}






  async function getProductData(productId: string) {
  try {
    const productRes = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/products/${productId}`, { next: { revalidate: 3600 } });

    if (!productRes.ok) {
      if (productRes.status === 404) notFound();
      throw new Error('Failed to fetch product');
    }
    const productData: Product = await productRes.json();
    console.log('Product Data fetched:', productData);
    if (productData.detailImages) {
      productData.detailImages.sort((a: ProductDetailImage, b: ProductDetailImage) => a.order - b.order);
    }

    const videosData: ProductVideo[] = productData.videos || [];
    console.log('Videos Data extracted:', videosData);

    return { product: productData, videos: videosData };
  } catch (error) {
    console.error('Error fetching product data:', error);
    notFound(); // Or handle error gracefully
  }
}



export default async function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params; // Use productId here

  const { product } = await getProductData(productId);

  if (!product) {
    notFound();
  }

  return <ProductDetailClient initialProduct={product} />;
}