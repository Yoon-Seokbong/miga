import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// GET a single sourced product by ID
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.sourcedProduct.findUnique({
      where: { id: params.id },
    });

    console.log('--- RAW PRODUCT IMAGES FROM DB ---', product?.images);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Robustly transform images and videos to handle both string[] and {url:string}[]
    const transformedProduct = {
      ...product,
      images: (product.images as (string | { url: string; })[] | null)
        ?.map(item => {
          if (typeof item === 'string') return { url: item };
          if (item && typeof item.url === 'string') return { url: item.url };
          return null;
        })
        .filter(Boolean) ?? [],
      videos: (product.videos as (string | { url: string; })[] | null)
        ?.map(item => {
          if (typeof item === 'string') return { url: item };
          if (item && typeof item.url === 'string') return { url: item.url };
          return null;
        })
        .filter(Boolean) ?? [],
    };

    console.log('--- SENDING SOURCED PRODUCT TO FRONTEND ---', JSON.stringify(transformedProduct, null, 2));
    return NextResponse.json(transformedProduct);
  } catch (error) {
    console.error('Failed to fetch sourced product:', error);
    return NextResponse.json({ error: 'Failed to fetch sourced product' }, { status: 500 });
  }
}

// UPDATE a sourced product by ID (Robust Version)
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const incomingData = await request.json();
    console.log('--- [PUT] 1. RECEIVED FROM FRONTEND ---', JSON.stringify(incomingData, null, 2));

    // Extract only the fields that are meant to be updated
    const {
      translatedName,
      localPrice,
      status,
      detailContent,
      images,
      videos,
      attributes,
      // Add any other fields that can be updated from the frontend
    } = incomingData;

    // Handle images: If the incoming images array is empty or undefined, preserve the existing one.
    let imagesToUpdate = images;
    if (!imagesToUpdate || imagesToUpdate.length === 0) {
      const existingProduct = await prisma.sourcedProduct.findUnique({
        where: { id: params.id },
        select: { images: true },
      });
      if (existingProduct && existingProduct.images) {
        imagesToUpdate = existingProduct.images;
      }
    }

    // Ensure images and videos are stored as an array of strings
    const imagesForDb = (imagesToUpdate as (string | { url: string; })[])?.map(img => typeof img === 'string' ? img : img.url).filter(Boolean);
    const videosForDb = (videos as (string | { url: string; })[])?.map(vid => typeof vid === 'string' ? vid : vid.url).filter(Boolean);

    const dataToUpdate = {
        translatedName,
        localPrice,
        status,
        detailContent,
        images: imagesForDb,
        videos: videosForDb,
        attributes,
    };

    console.log('--- [PUT] 2. DATA TO BE SAVED TO DB ---', JSON.stringify(dataToUpdate, null, 2));

    const updatedProduct = await prisma.sourcedProduct.update({
      where: { id: params.id },
      data: dataToUpdate,
    });

    // Transform the output to be consistent with the GET request
    const transformedProduct = {
        ...updatedProduct,
        images: (updatedProduct.images as string[] | null)?.map(url => ({ url })) ?? [],
        videos: (updatedProduct.videos as string[] | null)?.map(url => ({ url })) ?? [],
    };

    console.log('--- [PUT] 3. SENDING BACK TO FRONTEND ---', JSON.stringify(transformedProduct, null, 2));

    return NextResponse.json(transformedProduct);
    
  } catch (error) {
    console.error('Failed to update sourced product:', error);
    return NextResponse.json({ error: 'Failed to update sourced product' }, { status: 500 });
  }
}

// DELETE a sourced product by ID
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== 'ADMIN') {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    await prisma.sourcedProduct.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ message: 'Product deleted successfully' }, { status: 200 });
  } catch (error) {
    console.error('Failed to delete sourced product:', error);
    return NextResponse.json({ error: 'Failed to delete sourced product' }, { status: 500 });
  }
}