import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllBlogs, createBlog } from '@/data/store';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const query = searchParams.get('q');
    const fetchAll =
      searchParams.get('all') === 'true' || searchParams.get('status') === 'all';

    let blogs = getAllBlogs(fetchAll);

    if (category && category !== 'All' && category !== 'all') {
      blogs = blogs.filter((b) => b.category.toLowerCase() === category.toLowerCase());
    }

    if (query) {
      const q = query.toLowerCase();
      blogs = blogs.filter(
        (b) =>
          b.title.toLowerCase().includes(q) ||
          b.excerpt.toLowerCase().includes(q) ||
          b.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return NextResponse.json(
      { success: true, count: blogs.length, data: blogs, posts: blogs },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch blogs' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body.title) {
      return NextResponse.json(
        { success: false, error: 'Missing required blog title' },
        { status: 400 }
      );
    }

    const created = createBlog(body);

    try {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${created.slug}`);
      revalidatePath('/admin/blogs');
    } catch (_) {}

    return NextResponse.json(
      { success: true, data: created, post: created, postId: created.id },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create blog' },
      { status: 500 }
    );
  }
}
