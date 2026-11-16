import fs from 'fs/promises';
import { UPLOAD_DIR, MIME_BY_EXT } from '@/lib/uploads';

interface Props {
  params: Promise<{ name: string }>;
}

// Public: serves uploaded images. Next.js only serves /public files that existed at build time,
// so images uploaded later are streamed from the uploads folder by this route.
export async function GET(_request: Request, { params }: Props) {
  const { name } = await params;

  // Only our own generated names are allowed (blocks path traversal)
  if (!/^[0-9]+-[a-f0-9]{12}\.(jpg|png|webp|gif)$/.test(name)) {
    return new Response('Not found', { status: 404 });
  }

  try {
    const data = await fs.readFile(`${UPLOAD_DIR}/${name}`);
    const ext = name.split('.').pop() as string;
    return new Response(new Uint8Array(data), {
      headers: {
        'Content-Type': MIME_BY_EXT[ext],
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return new Response('Not found', { status: 404 });
  }
}