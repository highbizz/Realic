'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { BlogArticle } from '@/data/blogs';

const DEFAULT_CATEGORIES = [
  'All',
  'Market Trends',
  'Legal & RERA',
  'Patna Corridors',
  'Luxury Living',
  'NRI Advisory',
];

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

export default function BlogsClient() {
  const [blogs, setBlogs] = useState<BlogArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchBlogs() {
      try {
        const res = await fetch('/api/blogs', { cache: 'no-store' });
        const data = await res.json();
        if (data.success && Array.isArray(data.data)) {
          setBlogs(data.data);
        }
      } catch (err) {
        console.error('Failed to load blogs', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  const categories = useMemo(() => {
    const dynamicCats = blogs
      .map((b) => b.category)
      .filter((c): c is string => Boolean(c && c.trim()));
    return Array.from(new Set([...DEFAULT_CATEGORIES, ...dynamicCats]));
  }, [blogs]);

  const filteredBlogs = blogs.filter((b) => {
    const matchesCategory = selectedCategory === 'All' || b.category === selectedCategory;
    const tagList = Array.isArray(b.tags) ? b.tags : [];
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      (b.title || '').toLowerCase().includes(q) ||
      (b.title_hindi || '').toLowerCase().includes(q) ||
      (b.excerpt || '').toLowerCase().includes(q) ||
      tagList.some((t) => t.toLowerCase().includes(q));
    return matchesCategory && matchesSearch;
  });

  const featuredBlog = blogs.find((b) => b.featured) || blogs[0];
  const gridBlogs = featuredBlog
    ? filteredBlogs.filter((b) => b.id !== featuredBlog.id)
    : filteredBlogs;

  return (
    <div className="min-h-screen bg-white text-neutral-900">
      {/* Editorial Header */}
      <section className="relative pt-14 pb-16 bg-white border-b border-neutral-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-900 text-xs font-bold tracking-widest uppercase mb-4">
              <span className="w-2 h-2 rounded-full bg-neutral-900 animate-pulse"></span>
              Research & Advisory Intelligence
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-montserrat tracking-tight text-neutral-950 leading-[1.15]">
              The Realic <span className="italic font-serif font-normal">Quarterly Journal</span>
            </h1>
            <p className="mt-4 text-base sm:text-lg text-neutral-600 leading-relaxed font-normal">
              In-depth market intelligence, RERA title audit frameworks, corridor price indices, and wealth advisory reports for Patna luxury real estate.
            </p>
          </div>

          {/* Search & Categories Bar */}
          <div className="mt-10 flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-neutral-200">
            {/* Category Pills */}
            <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                    selectedCategory === cat
                      ? 'bg-neutral-900 text-white font-bold shadow-xs'
                      : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <span className="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-neutral-400 text-[18px]">
                search
              </span>
              <input
                type="text"
                placeholder="Search market reports, RERA, corridors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-900 text-xs placeholder:text-neutral-400 focus:outline-none focus:border-neutral-900 focus:bg-white focus:ring-1 focus:ring-neutral-900 transition-all"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <section className="py-14 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="py-24 text-center">
            <div className="inline-block w-10 h-10 border-3 border-neutral-900 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-sm font-semibold text-neutral-500 mt-4">Curating market research publications...</p>
          </div>
        ) : (
          <>
            {/* Featured Article Hero (When on 'All' or no filter) */}
            {selectedCategory === 'All' && !searchQuery && featuredBlog && (
              <div className="mb-14">
                <div className="relative rounded-3xl overflow-hidden border border-neutral-200 bg-white shadow-sm hover:shadow-xl transition-all duration-500 group">
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                    <div className="lg:col-span-7 relative h-72 sm:h-96 lg:h-auto min-h-[380px] overflow-hidden bg-neutral-100">
                      <img
                        src={featuredBlog.coverImage || featuredBlog.featured_image || '/images/projects/project_cover_1.jpg'}
                        alt={featuredBlog.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="px-3 py-1 rounded-full bg-neutral-900/90 backdrop-blur-md text-white font-bold text-[11px] tracking-wider uppercase shadow-sm">
                          Cover Story
                        </span>
                      </div>
                    </div>

                    <div className="lg:col-span-5 p-8 sm:p-10 flex flex-col justify-between bg-white">
                      <div>
                        <div className="flex items-center gap-2 text-xs text-neutral-500 mb-3 font-medium">
                          <span className="text-neutral-900 font-bold uppercase tracking-wider">{featuredBlog.category}</span>
                          <span>•</span>
                          <span>{featuredBlog.readTime || featuredBlog.read_time || '5 min read'}</span>
                          <span>•</span>
                          <span>{formatDisplayDate(featuredBlog.publishedAt || featuredBlog.published_at)}</span>
                        </div>

                        <Link href={`/blogs/${featuredBlog.slug}`}>
                          <h2 className="text-2xl sm:text-3xl font-bold font-montserrat text-neutral-950 group-hover:text-neutral-600 transition-colors leading-snug">
                            {featuredBlog.title}
                          </h2>
                          {featuredBlog.title_hindi && (
                            <p className="mt-1.5 text-sm font-medium text-neutral-500">
                              {featuredBlog.title_hindi}
                            </p>
                          )}
                        </Link>

                        <p className="mt-4 text-sm text-neutral-600 leading-relaxed line-clamp-3 font-normal">
                          {featuredBlog.excerpt}
                        </p>

                        <div className="flex flex-wrap gap-2 mt-6">
                          {(Array.isArray(featuredBlog.tags) ? featuredBlog.tags : []).slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              className="px-2.5 py-1 rounded-lg bg-neutral-100 border border-neutral-200 text-[11px] text-neutral-700 font-medium"
                            >
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-neutral-100 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <img
                            src={featuredBlog.author?.avatar || featuredBlog.author_avatar || '/images/projects/project_cover_1.jpg'}
                            alt={featuredBlog.author?.name || featuredBlog.author_name || 'Realic Editorial'}
                            className="w-10 h-10 rounded-full object-cover border border-neutral-200"
                          />
                          <div>
                            <p className="text-xs font-bold text-neutral-900">
                              {featuredBlog.author?.name || featuredBlog.author_name || 'Realic Editorial Team'}
                            </p>
                            <p className="text-[10px] text-neutral-500">
                              {featuredBlog.author?.role || featuredBlog.author_role || 'Property Advisory & Research'}
                            </p>
                          </div>
                        </div>

                        <Link
                          href={`/blogs/${featuredBlog.slug}`}
                          className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-bold text-xs tracking-wider uppercase transition-all flex items-center gap-1.5 shadow-xs"
                        >
                          <span>Read Report</span>
                          <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Articles Grid */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-xl font-bold font-montserrat text-neutral-900">
                {selectedCategory === 'All' ? 'Latest Publications' : `${selectedCategory} Intelligence`}
              </h3>
              <span className="text-xs text-neutral-500 font-medium">
                Showing {filteredBlogs.length} articles
              </span>
            </div>

            {filteredBlogs.length === 0 ? (
              <div className="p-16 rounded-3xl bg-neutral-50 border border-neutral-200 text-center">
                <span className="material-symbols-outlined text-4xl text-neutral-400 mb-2">menu_book</span>
                <p className="text-base font-semibold text-neutral-900">No publications match your criteria</p>
                <p className="text-xs text-neutral-500 mt-1">Try resetting the category filter or searching for another term.</p>
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setSearchQuery('');
                  }}
                  className="mt-4 px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold uppercase tracking-wider shadow-xs transition-all cursor-pointer"
                >
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {(selectedCategory === 'All' && !searchQuery ? gridBlogs : filteredBlogs).map((article) => (
                  <article
                    key={article.id}
                    className="flex flex-col justify-between rounded-2xl overflow-hidden bg-white border border-neutral-200 hover:border-neutral-400 hover:shadow-xl transition-all duration-500 hover:-translate-y-1.5 group"
                  >
                    <div>
                      {/* Image Thumbnail */}
                      <Link href={`/blogs/${article.slug}`} className="block relative h-52 overflow-hidden bg-neutral-100">
                        <img
                          src={article.coverImage || article.featured_image || '/images/projects/project_cover_1.jpg'}
                          alt={article.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out"
                        />
                        <div className="absolute top-3 left-3">
                          <span className="px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider bg-white/95 backdrop-blur-md text-neutral-900 border border-neutral-200 shadow-xs">
                            {article.category}
                          </span>
                        </div>
                      </Link>

                      {/* Content */}
                      <div className="p-6">
                        <div className="flex items-center gap-2 text-[11px] text-neutral-500 mb-2.5 font-medium">
                          <span>{formatDisplayDate(article.publishedAt || article.published_at)}</span>
                          <span>•</span>
                          <span>{article.readTime || article.read_time || '5 min read'}</span>
                        </div>

                        <Link href={`/blogs/${article.slug}`}>
                          <h4 className="text-lg font-bold font-montserrat text-neutral-950 group-hover:text-neutral-600 transition-colors leading-snug line-clamp-2">
                            {article.title}
                          </h4>
                          {article.title_hindi && (
                            <p className="mt-1 text-xs font-medium text-neutral-500 line-clamp-1">
                              {article.title_hindi}
                            </p>
                          )}
                        </Link>

                        <p className="mt-2.5 text-xs text-neutral-600 leading-relaxed line-clamp-3">
                          {article.excerpt}
                        </p>
                      </div>
                    </div>

                    {/* Author & Read More */}
                    <div className="px-6 py-4 border-t border-neutral-100 flex items-center justify-between bg-neutral-50">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={article.author?.avatar || article.author_avatar || '/images/projects/project_cover_1.jpg'}
                          alt={article.author?.name || article.author_name || 'Realic Editorial'}
                          className="w-7 h-7 rounded-full object-cover border border-neutral-200"
                        />
                        <span className="text-xs text-neutral-700 font-semibold">
                          {article.author?.name || article.author_name || 'Realic Editorial Team'}
                        </span>
                      </div>

                      <Link
                        href={`/blogs/${article.slug}`}
                        className="text-xs font-bold text-neutral-900 hover:text-neutral-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                      >
                        <span>Read</span>
                        <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                      </Link>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
