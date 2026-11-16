import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getBlogBySlug, updateBlog, deleteBlog } from '@/data/store';
import { requireAdmin } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

function mapToKlanePost(b: any) {
  return {
    ...b,
    id: b.id,
    title: b.title,
    title_hindi: b.title_hindi || '',
    slug: b.slug,
    excerpt: b.excerpt || '',
    content: typeof b.content === 'string' ? b.content : JSON.stringify(b.content),
    featured_image: b.featured_image || b.coverImage || '',
    coverImage: b.coverImage || b.featured_image || '',
    author: typeof b.author === 'object' ? b.author.name : b.author || 'Amit Vikram',
    author_name: typeof b.author === 'object' ? b.author.name : b.author_name || b.author || 'Amit Vikram',
    author_role:
      typeof b.author === 'object'
        ? b.author.role
        : b.author_role || 'Managing Director, Bihar & Eastern Corridor',
    author_avatar:
      typeof b.author === 'object'
        ? b.author.avatar
        : b.author_avatar ||
          'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
    authorObj: b.author,
    status: b.status || 'published',
    tags: Array.isArray(b.tags) ? b.tags.join(', ') : b.tags || '',
    category: b.category || 'Market Trends',
    category_hindi: b.category_hindi || '',
    read_time: b.read_time || b.readTime || '5 min read',
    featured: b.featured ? 1 : 0,
    published_at: b.published_at || b.publishedAt || null,
    meta_title: b.meta_title || b.metaTitle || '',
    meta_description: b.meta_description || b.metaDescription || '',
    canonicalUrl: b.canonicalUrl || '',
    relatedPropertyIds: b.relatedPropertyIds || [],
    created_at: b.created_at || b.publishedAt || new Date().toISOString(),
    updated_at: b.updated_at || new Date().toISOString(),
  };
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const blog = getBlogBySlug(id, true);

  if (!blog) {
    return NextResponse.json({ success: false, error: 'Post not found' }, { status: 404 });
  }

  return NextResponse.json(
    { success: true, post: mapToKlanePost(blog), data: blog },
    {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      },
    }
  );
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await req.json();

    if (!body.title || !body.slug) {
      return NextResponse.json(
        { success: false, error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const updated = updateBlog(id, body);
    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    try {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${updated.slug}`);
      revalidatePath(`/blogs/${id}`);
      revalidatePath('/admin/blogs');
    } catch (_) {}

    return NextResponse.json({
      success: true,
      post: mapToKlanePost(updated),
      data: updated,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update post' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const deleted = deleteBlog(id);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    try {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${id}`);
      revalidatePath('/admin/blogs');
    } catch (_) {}

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}

