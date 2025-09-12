'use server';

import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const data = await request.formData();
    const file: File | null = data.get('file') as unknown as File;

    if (!file) {
      return NextResponse.json({ success: false, message: 'No file uploaded.' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const extension = file.name.split('.').pop();
    const uniqueFilename = `${uuidv4()}.${extension}`;

    // Define the path to save the file
    const uploadDir = join(process.cwd(), 'public', 'uploads');
    const path = join(uploadDir, uniqueFilename);

    // Write the file to the filesystem
    await writeFile(path, buffer);

    console.log(`File uploaded to ${path}`);

    const imageUrl = `/uploads/${uniqueFilename}`;

    return NextResponse.json({ success: true, url: imageUrl });

  } catch (error) {
    console.error('Upload error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ success: false, message: `Something went wrong: ${errorMessage}` }, { status: 500 });
  }
}
