import { NextResponse } from 'next/server';
import crypto from 'crypto';
import fs from 'fs/promises';
import { requireAdmin } from '@/lib/adminAuth';
import { UPLOAD_DIR, MAX_UPLOAD_BYTES, detectImageExt } from '@/lib/uploads';

// Admin-only image upload. Returns a short URL to store in the database instead of a huge base64 string.
export async function POST(request: Request) {
  const denied = await requireAdmin();
  if (denied) return denied;

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file received' }, { status: 400 });
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json({ success: false, error: 'Image must be under 5MB' }, { status: 413 });
    }

    const buf = Buffer.from(await file.arrayBuffer());
    const ext = detectImageExt(buf);
    if (!ext) {
      return NextResponse.json(
        { success: false, error: 'Only JPG, PNG, WebP or GIF images are allowed' },
        { status: 415 }
      );
    }

    await fs.mkdir(UPLOAD_DIR, { recursive: true });
    const name = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}.${ext}`;
    await fs.writeFile(`${UPLOAD_DIR}/${name}`, buf);

    return NextResponse.json({ success: true, url: `/api/uploads/${name}` }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Upload failed' },
      { status: 500 }
    );
  }
}