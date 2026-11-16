import { NextResponse } from 'next/server';
import { mkdir, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

const BLOG_UPLOAD_DIR = path.join(process.cwd(), 'public', 'images', 'blogs');
const PROJECTS_DIR = path.join(process.cwd(), 'public', 'images', 'projects');

interface MediaItem {
  name: string;
  url: string;
  type: string;
  size: number;
  uploaded_at: string;
}

async function scanDirectory(dirPath: string, urlPrefix: string): Promise<MediaItem[]> {
  if (!existsSync(dirPath)) return [];
  const results: MediaItem[] = [];
  const entries = await readdir(dirPath, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      const subItems = await scanDirectory(fullPath, `${urlPrefix}/${entry.name}`);
      results.push(...subItems);
    } else if (
      entry.isFile() &&
      /\.(jpg|jpeg|jfif|pjpeg|png|gif|webp|svg|avif)$/i.test(entry.name)
    ) {
      const stats = await stat(fullPath);
      results.push({
        name: entry.name,
        url: `${urlPrefix}/${entry.name}`,
        type: `image/${path.extname(entry.name).slice(1).toLowerCase()}`,
        size: stats.size,
        uploaded_at: stats.mtime.toISOString(),
      });
    }
  }
  return results;
}

export async function GET() {
  try {
    if (!existsSync(BLOG_UPLOAD_DIR)) {
      await mkdir(BLOG_UPLOAD_DIR, { recursive: true });
    }

    const [uploadedFiles, projectFiles] = await Promise.all([
      scanDirectory(BLOG_UPLOAD_DIR, '/images/blogs'),
      scanDirectory(PROJECTS_DIR, '/images/projects'),
    ]);

    uploadedFiles.sort(
      (a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime()
    );
    projectFiles.sort((a, b) => a.name.localeCompare(b.name));

    const files = [...uploadedFiles, ...projectFiles];

    return NextResponse.json(
      { success: true, files },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to list media' },
      { status: 500 }
    );
  }
}

