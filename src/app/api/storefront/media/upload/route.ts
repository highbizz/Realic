import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'blogs');

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    if (!existsSync(UPLOAD_DIR)) {
      await mkdir(UPLOAD_DIR, { recursive: true });
    }

    const formData = await req.formData();
    const files = formData.getAll('files');

    if (!files || files.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No files provided' },
        { status: 400 }
      );
    }

    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/pjpeg',
      'image/jfif',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
      'image/avif',
    ];
    const allowedExts = ['.jpg', '.jpeg', '.jfif', '.png', '.gif', '.webp', '.svg', '.avif'];
    const maxSize = 10 * 1024 * 1024; // 10MB limit

    const uploaded: string[] = [];

    for (const file of files) {
      if (!(file instanceof File)) continue;

      const ext = path.extname(file.name).toLowerCase() || '.jpg';
      const isTypeAllowed =
        allowedTypes.includes(file.type.toLowerCase()) || allowedExts.includes(ext);

      if (!isTypeAllowed) {
        return NextResponse.json(
          {
            success: false,
            error: `Invalid file type: ${file.name}. Allowed: JPG, PNG, GIF, WebP, SVG, AVIF`,
          },
          { status: 400 }
        );
      }

      if (file.size > maxSize) {
        return NextResponse.json(
          { success: false, error: `File too large: ${file.name}. Max 10MB allowed.` },
          { status: 400 }
        );
      }

      const baseName = path
        .basename(file.name, ext)
        .replace(/[^a-zA-Z0-9_-]/g, '_')
        .slice(0, 60);
      const timestamp = Date.now();
      const newFileName = `${baseName}_${timestamp}${ext}`;
      const filePath = path.join(UPLOAD_DIR, newFileName);

      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(filePath, buffer);
      uploaded.push(`/images/blogs/${newFileName}`);
    }

    return NextResponse.json(
      { success: true, uploaded, count: uploaded.length },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}

