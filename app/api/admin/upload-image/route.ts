import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import path from 'path';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
    const session = await getServerSession(authOptions);
    if (session?.user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const data = await request.formData();
        const file: File | null = data.get('file') as unknown as File;

        if (!file) {
            return NextResponse.json({ error: 'No file provided.' }, { status: 400 });
        }

        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);

        // Create a unique filename
        const filename = `${Date.now()}-${file.name.replace(/\s+/g, '_')}`;
        const uploadPath = path.join(process.cwd(), 'public/uploads', filename);

        // Write the file to the public/uploads directory
        await writeFile(uploadPath, buffer);

        const publicUrl = `/uploads/${filename}`;

        return NextResponse.json({ success: true, url: publicUrl });

    } catch (error) {
        console.error('Error uploading image:', error);
        return NextResponse.json({ error: 'Image upload failed.' }, { status: 500 });
    }
}
