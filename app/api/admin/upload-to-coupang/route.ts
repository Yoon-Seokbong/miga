import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getAllCategories, createCoupangProduct } from '@/lib/coupang-api';

interface CoupangCategory {
  name: string;
  displayItemCategoryCode: string;
  child: CoupangCategory[];
}

interface FoundCategory {
  name: string;
  code: string;
  fullPath: string;
}

// Recursive helper to find ALL categories containing a substring and return their full path
const findAllCategoriesWithSubstring = (
  categories: CoupangCategory[], 
  substring: string, 
  currentPath: string[] = []
): FoundCategory[] => {
  let results: FoundCategory[] = [];
  for (const category of categories) {
    const newPath = [...currentPath, category.name];
    if (category.name && category.name.includes(substring)) {
      results.push({
        name: category.name,
code: category.displayItemCategoryCode,
        fullPath: newPath.join(' > ') // Add full path
      });
    }
    if (category.child && category.child.length > 0) {
      results = results.concat(findAllCategoriesWithSubstring(category.child, substring, newPath));
    }
  }
  return results;
};

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const { productId } = await request.json();
    if (!productId) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
    }

    // 1. Fetch our product from the database
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { images: true },
    });
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Get all categories and find broader categories containing "자전거"
    console.log('--- [DEBUG] Fetching all Coupang categories and searching for \'자전거\'... ---');
    const categoryData = await getAllCategories();

    if (!categoryData || !Array.isArray(categoryData.child)) {
        console.error("Coupang category data format is unexpected:", categoryData);
        throw new Error("Coupang category data format is unexpected. Expected an object with a 'child' array.");
    }

    const topLevelCategories = categoryData.child;
    const searchResults = findAllCategoriesWithSubstring(topLevelCategories, "자전거");

    if (searchResults.length === 0) {
      throw new Error('Could not find any category containing "자전거". Please check Coupang category structure.');
    }

    console.log('--- [DEBUG] Found categories containing "자전거" ---');
    console.log(JSON.stringify(searchResults, null, 2));
    console.log('--- [DEBUG] End of Search ---');

    // For now, we will just return the search results. User will pick the best one.
    return NextResponse.json({
        message: 'Found potential categories. Please check the server console log and provide the correct full path (e.g., "가전/디지털 > 자전거/킥보드 > 전기자전거") and its code.',
        results: searchResults
    });

  } catch (error) {
    console.error('Failed to upload product to Coupang:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json({ error: 'Failed to upload product to Coupang', details: errorMessage }, { status: 500 });
  }
}