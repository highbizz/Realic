import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAllBlogs, createBlog, getBlogBySlug } from '@/data/store';
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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const fetchAll =
      searchParams.get('all') === 'true' || searchParams.get('status') === 'all';

    const blogs = getAllBlogs(fetchAll);
    const posts = blogs.map(mapToKlanePost);

    return NextResponse.json(
      { success: true, posts, data: blogs },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const body = await req.json();
    const { title, slug } = body;

    if (!title || !slug) {
      return NextResponse.json(
        { success: false, error: 'Title and slug are required' },
        { status: 400 }
      );
    }

    const existing = getBlogBySlug(slug, true);
    if (existing && existing.slug.toLowerCase() === String(slug).trim().toLowerCase()) {
      return NextResponse.json(
        { success: false, error: 'A post with this slug already exists' },
        { status: 409 }
      );
    }

    const created = createBlog(body);

    try {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${created.slug}`);
      revalidatePath('/admin/blogs');
    } catch (_) {}

    return NextResponse.json(
      {
        success: true,
        postId: created.id,
        post: mapToKlanePost(created),
        data: created,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create post' },
      { status: 500 }
    );
  }
}

