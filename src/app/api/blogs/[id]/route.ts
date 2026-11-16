import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { revalidatePath } from 'next/cache';
import { getBlogBySlug, updateBlog, deleteBlog } from '@/data/store';

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ id: string }>;
}

export async function GET(request: Request, { params }: Props) {
  try {
    const { id } = await params;
    const blog = getBlogBySlug(id, true);

    if (!blog) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    return NextResponse.json(
      { success: true, data: blog, post: blog },
      {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        },
      }
    );
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch blog' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request, { params }: Props) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const body = await request.json();

    const updated = updateBlog(id, body);
    if (!updated) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    try {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${updated.slug}`);
      revalidatePath(`/blogs/${id}`);
      revalidatePath('/admin/blogs');
    } catch (_) {}

    return NextResponse.json({ success: true, data: updated, post: updated });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update blog' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, { params }: Props) {
  const denied = await requireAdmin();
  if (denied) return denied;
  try {
    const { id } = await params;
    const deleted = deleteBlog(id);

    if (!deleted) {
      return NextResponse.json({ success: false, error: 'Blog not found' }, { status: 404 });
    }

    try {
      revalidatePath('/blogs');
      revalidatePath(`/blogs/${id}`);
      revalidatePath('/admin/blogs');
    } catch (_) {}

    return NextResponse.json({ success: true, message: 'Blog deleted successfully' });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to delete blog' },
      { status: 500 }
    );
  }
}
