'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { BlogArticle } from '@/data/blogs';
import { Property } from '@/data/properties';

interface BlogDetailClientProps {
  slug: string;
  initialBlog: BlogArticle | null;
  initialRelatedBlogs: BlogArticle[];
  interlinkedProperties: Property[];
}

function formatDisplayDate(dateStr?: string | null) {
  if (!dateStr) return 'Recent';
  if (/^\d{4}-\d{2}-\d{2}/.test(dateStr)) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) {
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  }
  return dateStr;
}

export default function BlogDetailClient({
  slug,
  initialBlog,
  initialRelatedBlogs,
  interlinkedProperties,
}: BlogDetailClientProps) {
  const [blog, setBlog] = useState<BlogArticle | null>(initialBlog);
  const [relatedBlogs, setRelatedBlogs] = useState<BlogArticle[]>(initialRelatedBlogs);
  const [loading, setLoading] = useState(!initialBlog);

  useEffect(() => {
    let active = true;
    const pathParts =
      typeof window !== 'undefined'
        ? window.location.pathname.split('/').filter(Boolean)
        : [];
    const activeSlug =
      pathParts[0] === 'blogs' && pathParts[1]
        ? decodeURIComponent(pathParts[1])
        : slug;

    if (activeSlug !== slug) {
      setLoading(true);
    }

    async function fetchLiveBlog() {
      try {
        const [postRes, listRes] = await Promise.all([
          fetch(`/api/blogs/${encodeURIComponent(activeSlug)}`, { cache: 'no-store' }),
          fetch('/api/blogs', { cache: 'no-store' }),
        ]);
        if (postRes.ok) {
          const postData = await postRes.json();
          if (active && postData.success && postData.data) {
            setBlog(postData.data);
          }
        } else if (activeSlug !== slug && active) {
          setBlog(null);
        }
        if (listRes.ok) {
          const listData = await listRes.json();
          if (active && listData.success && Array.isArray(listData.data)) {
            setRelatedBlogs(
              listData.data
                .filter((b: BlogArticle) => b.slug !== activeSlug)
                .slice(0, 3)
            );
          }
        }
      } catch (err) {
        console.error('Failed to refresh live blog article:', err);
      } finally {
        if (active) setLoading(false);
      }
    }
    fetchLiveBlog();
    return () => {
      active = false;
    };
  }, [slug]);

  const parsedContent = useMemo(() => {
    const raw = blog?.content || '';
    if (!raw) return { mode: 'html' as const, blocks: [] as string[] };

    // 1. Check if content is a JSON array saved by Klane RichTextEditor
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return {
          mode: 'blocks' as const,
          blocks: parsed.map((item) => String(item)),
        };
      }
    } catch {
      // Not JSON array
    }

    // 2. Check if raw string contains HTML tags
    if (/<[a-z][\s\S]*>/i.test(raw)) {
      return {
        mode: 'html' as const,
        blocks: [raw],
      };
    }

    // 3. Markdown / plain text paragraphs
    const paragraphs = raw
      .split('\n\n')
      .map((chunk) => chunk.trim())
      .filter((chunk) => chunk.length > 0);

    return {
      mode: 'markdown' as const,
      blocks: paragraphs,
    };
  }, [blog?.content]);

  if (loading && !blog) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-12">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-sm font-semibold text-neutral-600">Loading publication...</p>
        </div>
      </div>
    );
  }

  if (!blog) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 text-center">
        <h1 className="text-3xl font-extrabold font-montserrat text-neutral-900 mb-3">
          Publication Not Found
        </h1>
        <p className="text-sm text-neutral-500 mb-6">
          The article you are looking for may have been moved or is currently in draft.
        </p>
        <Link
          href="/blogs"
          className="px-5 py-2.5 rounded-xl bg-neutral-900 text-white text-xs font-bold uppercase tracking-wider hover:bg-neutral-800 transition-all"
        >
          Back to Research Journal
        </Link>
      </div>
    );
  }

  const authorName = blog.author?.name || blog.author_name || 'Realic Editorial Team';
  const authorRole = blog.author?.role || blog.author_role || 'Property Advisory & Research';
  const authorAvatar =
    blog.author?.avatar || blog.author_avatar || '/images/projects/project_cover_1.jpg';
  const coverImage =
    blog.coverImage || blog.featured_image || '/images/projects/project_cover_1.jpg';
  const readTime = blog.readTime || blog.read_time || '5 min read';
  const publishedDate = formatDisplayDate(blog.publishedAt || blog.published_at);
  const tagList: string[] = Array.isArray(blog.tags) && blog.tags.length > 0
    ? blog.tags
    : Array.isArray(blog.keywords)
      ? blog.keywords
      : typeof blog.keywords === 'string' && blog.keywords.trim()
        ? blog.keywords
            .split(',')
            .map((t: string) => t.trim())
            .filter(Boolean)
        : [];

  return (
    <div className="min-h-screen bg-white text-neutral-900 selection:bg-neutral-200 selection:text-neutral-900">
      {/* Navigation Breadcrumb */}
      <div className="py-4 border-b border-neutral-200 bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <nav className="flex items-center gap-2 text-xs text-neutral-500">
            <Link href="/" className="hover:text-neutral-900 transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link href="/blogs" className="hover:text-neutral-900 transition-colors">
              Research & Intelligence
            </Link>
            <span>/</span>
            <span className="text-neutral-900 font-semibold line-clamp-1">{blog.category}</span>
          </nav>
        </div>
      </div>

      {/* Article Header */}
      <header className="pt-12 pb-8 max-w-4xl mx-auto px-4 sm:px-6">
        <div className="flex items-center flex-wrap gap-3 mb-5">
          <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-neutral-100 text-neutral-900 border border-neutral-200">
            {blog.category}
            {blog.category_hindi ? ` • ${blog.category_hindi}` : ''}
          </span>
          <span className="text-xs text-neutral-500 font-medium">{readTime}</span>
          <span className="text-neutral-300">•</span>
          <span className="text-xs text-neutral-500 font-medium">{publishedDate}</span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-montserrat text-neutral-950 tracking-tight leading-[1.2]">
          {blog.title}
        </h1>

        {blog.title_hindi && (
          <p className="mt-2 text-xl sm:text-2xl font-semibold text-neutral-500 leading-snug">
            {blog.title_hindi}
          </p>
        )}

        {blog.excerpt && (
          <p className="mt-5 text-lg sm:text-xl text-neutral-600 leading-relaxed font-normal border-l-4 border-neutral-900 pl-4 italic">
            {blog.excerpt}
          </p>
        )}

        {/* Author Badge */}
        <div className="mt-8 pt-6 border-t border-neutral-200 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3.5">
            <img
              src={authorAvatar}
              alt={authorName}
              className="w-12 h-12 rounded-full object-cover border border-neutral-200 shadow-sm"
            />
            <div>
              <p className="text-sm font-bold text-neutral-900">{authorName}</p>
              <p className="text-xs text-neutral-500">{authorRole}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-neutral-500">
            <span className="font-semibold">Verified Publication</span>
            <span className="material-symbols-outlined text-neutral-900 text-[18px]">verified</span>
          </div>
        </div>
      </header>

      {/* Hero Cover Image */}
      {coverImage && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-12">
          <div className="relative h-[320px] sm:h-[460px] rounded-3xl overflow-hidden border border-neutral-200 shadow-sm bg-neutral-100">
            <img src={coverImage} alt={blog.title} className="w-full h-full object-cover" />
          </div>
        </div>
      )}

      {/* Article Body Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 pb-20">
        <style>{`
          .blog-content {
            color: #262626;
            font-size: 1.0625rem;
            line-height: 1.85;
          }
          .blog-content h1 {
            font-size: 2.25rem;
            font-weight: 800;
            color: #0a0a0a;
            margin-top: 2.25rem;
            margin-bottom: 1rem;
            line-height: 1.25;
          }
          .blog-content h2 {
            font-size: 1.75rem;
            font-weight: 700;
            color: #0a0a0a;
            margin-top: 2rem;
            margin-bottom: 0.75rem;
            padding-bottom: 0.5rem;
            border-bottom: 1px solid #e5e5e5;
            line-height: 1.3;
          }
          .blog-content h3 {
            font-size: 1.375rem;
            font-weight: 700;
            color: #171717;
            margin-top: 1.75rem;
            margin-bottom: 0.625rem;
            line-height: 1.35;
          }
          .blog-content h4, .blog-content h5, .blog-content h6 {
            font-size: 1.125rem;
            font-weight: 700;
            color: #171717;
            margin-top: 1.5rem;
            margin-bottom: 0.5rem;
          }
          .blog-content p {
            margin-bottom: 1.35rem;
            color: #374151;
            line-height: 1.85;
          }
          .blog-content ul {
            list-style-type: disc;
            padding-left: 1.5rem;
            margin: 1.25rem 0;
          }
          .blog-content ol {
            list-style-type: decimal;
            padding-left: 1.5rem;
            margin: 1.25rem 0;
          }
          .blog-content li {
            margin-bottom: 0.5rem;
            color: #374151;
            line-height: 1.75;
          }
          .blog-content blockquote {
            border-left: 4px solid #171717;
            background: #f9fafb;
            padding: 1.25rem 1.5rem;
            border-radius: 0 1rem 1rem 0;
            font-style: italic;
            color: #1f2937;
            margin: 1.75rem 0;
          }
          .blog-content pre {
            background: #111827;
            color: #f3f4f6;
            padding: 1.25rem;
            border-radius: 0.875rem;
            overflow-x: auto;
            font-size: 0.875rem;
            margin: 1.5rem 0;
          }
          .blog-content a {
            color: #111827;
            font-weight: 600;
            text-decoration: underline;
            text-underline-offset: 3px;
          }
          .blog-content img {
            max-width: 100%;
            height: auto;
            border-radius: 1rem;
            margin: 1.75rem 0;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
          }
          .blog-content strong, .blog-content b {
            font-weight: 700;
            color: #111827;
          }
        `}</style>

        {parsedContent.mode === 'blocks' && (
          <article className="blog-content space-y-4">
            {parsedContent.blocks.map((block, index) => {
              const isHtml = /<[a-z][\s\S]*>/i.test(block);
              if (isHtml) {
                return <div key={index} dangerouslySetInnerHTML={{ __html: block }} />;
              }
              return <p key={index}>{block}</p>;
            })}
          </article>
        )}

        {parsedContent.mode === 'html' && (
          <article
            className="blog-content"
            dangerouslySetInnerHTML={{ __html: parsedContent.blocks[0] || '' }}
          />
        )}

        {parsedContent.mode === 'markdown' && (
          <article className="space-y-6 text-neutral-800 leading-relaxed text-base sm:text-lg">
            {parsedContent.blocks.map((paragraph, idx) => {
              if (paragraph.startsWith('### ')) {
                return (
                  <h3
                    key={idx}
                    className="text-2xl sm:text-3xl font-bold font-outfit text-neutral-950 pt-6 pb-2 border-b border-neutral-200"
                  >
                    {paragraph.replace('### ', '')}
                  </h3>
                );
              }
              if (paragraph.startsWith('## ')) {
                return (
                  <h2
                    key={idx}
                    className="text-2xl sm:text-3xl font-bold font-outfit text-neutral-950 pt-8 pb-3 border-b border-neutral-200"
                  >
                    {paragraph.replace('## ', '')}
                  </h2>
                );
              }
              if (paragraph.startsWith('> ')) {
                return (
                  <blockquote
                    key={idx}
                    className="my-6 p-6 rounded-2xl bg-neutral-50 border-l-4 border-neutral-900 text-neutral-800 text-base italic font-serif leading-relaxed shadow-xs"
                  >
                    {paragraph.replace(/^>\s*/gm, '')}
                  </blockquote>
                );
              }
              if (paragraph.startsWith('- ') || paragraph.startsWith('* ')) {
                const listItems = paragraph
                  .split('\n')
                  .map((l) => l.replace(/^[-*]\s*/, '').trim())
                  .filter((l) => l.length > 0);
                return (
                  <ul key={idx} className="space-y-2.5 my-4 pl-4">
                    {listItems.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3 text-neutral-700">
                        <span className="w-2 h-2 rounded-full bg-neutral-900 mt-2.5 flex-shrink-0"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={idx} className="text-neutral-700 leading-relaxed font-normal">
                  {paragraph}
                </p>
              );
            })}
          </article>
        )}

        {/* Interlinked Featured Properties in this Corridor */}
        {interlinkedProperties.length > 0 && (
          <div className="mt-12 p-6 sm:p-8 rounded-3xl bg-neutral-50 border border-neutral-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                  Recommended Corridors
                </span>
                <h3 className="text-lg font-bold font-outfit text-neutral-950">
                  Featured Properties In This Area
                </h3>
              </div>
              <Link
                href="/properties"
                className="text-xs font-bold text-neutral-900 hover:underline flex items-center gap-1"
              >
                <span>All listings</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {interlinkedProperties.map((prop) => (
                <Link
                  key={prop.id}
                  href={`/properties/${prop.slug}`}
                  className="p-3.5 rounded-2xl bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-md transition-all flex items-center gap-3.5 group"
                >
                  <img
                    src={prop.images[0]}
                    alt={prop.title}
                    className="w-16 h-16 rounded-xl object-cover flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h4 className="text-xs font-bold text-neutral-900 group-hover:text-neutral-600 line-clamp-1 font-outfit">
                      {prop.title}
                    </h4>
                    <p className="text-[11px] text-neutral-500 line-clamp-1">{prop.location}</p>
                    <span className="text-xs font-extrabold text-neutral-900 font-outfit block mt-0.5">
                      {prop.priceDisplay}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Tags */}
        {tagList.length > 0 && (
          <div className="pt-8 mt-12 border-t border-neutral-200 flex flex-wrap items-center gap-2">
            <span className="text-xs text-neutral-500 font-semibold mr-2">Filed under:</span>
            {tagList.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-xs text-neutral-700 font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author Card */}
        <div className="mt-12 p-8 rounded-3xl bg-neutral-50 border border-neutral-200 flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <img
            src={authorAvatar}
            alt={authorName}
            className="w-20 h-20 rounded-2xl object-cover border border-neutral-200 shadow-sm"
          />
          <div className="text-center sm:text-left flex-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
              About the Author
            </span>
            <h4 className="text-lg font-bold font-montserrat text-neutral-900 mt-1">
              {authorName}
            </h4>
            <p className="text-xs text-neutral-500 mt-0.5">{authorRole}</p>
            <p className="text-xs text-neutral-600 mt-3 leading-relaxed">
              Specializing in institutional property investments, RERA compliance audits, and high-value sky penthouses across Bihar and Karnataka.
            </p>
            <div className="mt-4 flex items-center justify-center sm:justify-start gap-3">
              <Link
                href="/contact"
                className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold transition-all shadow-xs"
              >
                Schedule Advisory Session
              </Link>
            </div>
          </div>
        </div>

        {/* CTA Banner */}
        <div className="mt-12 p-8 sm:p-10 rounded-3xl bg-neutral-50 text-neutral-900 border border-neutral-200 shadow-sm relative overflow-hidden">
          <div className="relative z-10 max-w-xl">
            <span className="px-3 py-1 rounded-full bg-white text-neutral-900 text-xs font-bold uppercase tracking-wider border border-neutral-200 shadow-xs">
              Institutional Advisory
            </span>
            <h3 className="text-2xl font-bold font-montserrat text-neutral-900 mt-4">
              Conduct a RERA Due Diligence or Portfolio Appraisal
            </h3>
            <p className="mt-2 text-sm text-neutral-600">
              Are you looking to acquire luxury inventory in Patna? Our legal counsel and senior acquisition team will verify 30-year title deeds and ensure RERA compliance.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href="/properties"
                className="px-5 py-2.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all"
              >
                Explore Verified Estates
              </Link>
              <Link
                href="/contact"
                className="px-5 py-2.5 rounded-xl border border-neutral-300 hover:bg-neutral-100 text-neutral-800 text-xs font-semibold transition-all shadow-xs"
              >
                Request Private Showing
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Related Articles */}
      {relatedBlogs.length > 0 && (
        <section className="py-16 border-t border-neutral-200 bg-neutral-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h3 className="text-2xl font-bold font-montserrat text-neutral-900">
                  Related Market Intelligence
                </h3>
                <p className="text-xs text-neutral-500 mt-1">
                  Continue reading curated analysis from Realic research partners.
                </p>
              </div>
              <Link
                href="/blogs"
                className="text-xs font-bold text-neutral-900 hover:underline flex items-center gap-1"
              >
                <span>View All Journal Entries</span>
                <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedBlogs.map((item) => (
                <Link
                  key={item.id}
                  href={`/blogs/${item.slug}`}
                  className="group rounded-2xl overflow-hidden bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="h-44 rounded-xl overflow-hidden mb-4 bg-neutral-100">
                      <img
                        src={
                          item.coverImage ||
                          item.featured_image ||
                          '/images/projects/project_cover_1.jpg'
                        }
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                      {item.category}
                    </span>
                    <h4 className="text-base font-bold font-montserrat text-neutral-900 group-hover:text-neutral-600 transition-colors mt-1.5 line-clamp-2">
                      {item.title}
                    </h4>
                    <p className="text-xs text-neutral-600 mt-2 line-clamp-2">{item.excerpt}</p>
                  </div>
                  <div className="mt-4 pt-4 border-t border-neutral-100 flex items-center justify-between text-[11px] text-neutral-500 font-medium">
                    <span>{formatDisplayDate(item.publishedAt || item.published_at)}</span>
                    <span>{item.readTime || item.read_time || '5 min read'}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

