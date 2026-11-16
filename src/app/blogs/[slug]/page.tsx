import React from 'react';
import type { Metadata } from 'next';
import { connection } from 'next/server';
import { getAllBlogs, getBlogBySlug, getAllProperties } from '@/data/store';
import BlogDetailClient from './BlogDetailClient';

export const dynamicParams = true;

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const blog = getBlogBySlug(slug);

  if (!blog) {
    return {
      title: 'Article Not Found | Realic Property Consultant',
    };
  }

  const metaTitle =
    blog.metaTitle || blog.meta_title || `${blog.title} | Realic Property Consultant`;
  const metaDescription = blog.metaDescription || blog.meta_description || blog.excerpt;
  const coverImage =
    blog.coverImage || blog.featured_image || '/images/projects/project_cover_1.jpg';
  const authorName = blog.author?.name || blog.author_name || 'Realic Editorial Team';
  const canonical =
    blog.canonical_url || blog.canonicalUrl || `https://realicproperty.com/blogs/${blog.slug}`;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords:
      (typeof blog.keywords === 'string' ? blog.keywords : undefined) ||
      (Array.isArray(blog.tags) ? blog.tags.join(', ') : undefined),
    alternates: {
      canonical,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      type: 'article',
      publishedTime: blog.publishedAt || blog.published_at || undefined,
      authors: [authorName],
      images: [
        {
          url: coverImage,
          width: 1200,
          height: 630,
          alt: blog.title,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      images: [coverImage],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  await connection();
  const { slug } = await params;
  const blog = getBlogBySlug(slug) || null;

  const allBlogs = getAllBlogs();
  const relatedBlogs = allBlogs
    .filter((b) => b.slug !== slug && b.id !== blog?.id)
    .slice(0, 3);

  const allProperties = getAllProperties();
  const interlinkedProperties = blog?.relatedPropertyIds?.length
    ? allProperties.filter((p) => blog.relatedPropertyIds?.includes(p.id))
    : [];

  const jsonLd = blog
    ? {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: blog.metaTitle || blog.meta_title || blog.title,
        description: blog.metaDescription || blog.meta_description || blog.excerpt,
        image: blog.coverImage || blog.featured_image,
        datePublished: blog.publishedAt || blog.published_at,
        dateModified: blog.updated_at || blog.publishedAt || blog.published_at,
        keywords:
          blog.keywords ||
          (Array.isArray(blog.tags) ? blog.tags.join(', ') : ''),
        author: {
          '@type': 'Person',
          name: blog.author?.name || blog.author_name || 'Realic Editorial Team',
          jobTitle:
            blog.author?.role || blog.author_role || 'Property Advisory & Research',
        },
        publisher: {
          '@type': 'Organization',
          name: 'Realic Property Consultant',
          logo: {
            '@type': 'ImageObject',
            url: 'https://realicproperty.com/images/realic-logo.png',
          },
        },
        mainEntityOfPage: {
          '@type': 'WebPage',
          '@id':
            blog.canonical_url || `https://realicproperty.com/blogs/${blog.slug}`,
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <BlogDetailClient
        slug={slug}
        initialBlog={blog}
        initialRelatedBlogs={relatedBlogs}
        interlinkedProperties={interlinkedProperties}
      />
    </>
  );
}
