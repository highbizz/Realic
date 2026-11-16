'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Hero slideshow (optimized copies live in /public/images/hero)
const HERO_SLIDES = [
  { src: '/images/hero/hero-1.webp', name: 'Winsome Icon', slug: 'winsome-icon', position: 'right 20% center' },
  { src: '/images/hero/hero-2.webp', name: 'Venus Capital Heights', slug: 'venus-capital-heights', position: 'center' },
  { src: '/images/hero/hero-3.webp', name: 'Durga Lifestyle', slug: 'durga-lifestyle', position: 'center' },
  { src: '/images/hero/hero-4.webp', name: 'Winsome Elite', slug: 'winsome-elite', position: 'center' },
  { src: '/images/hero/hero-5.webp', name: 'Satvika Rajpati Enclave', slug: 'satvika-rajpati-enclave', position: 'center' },
];
const SLIDE_INTERVAL_MS = 5500;

export const HeroSection: React.FC = () => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'Buy' | 'Sell'>('Buy');
  const [searchQuery, setSearchQuery] = useState('');
  const [slide, setSlide] = useState(0);
  const [paused, setPaused] = useState(false);

  // Auto-advance; stays still for visitors who prefer reduced motion, and while hovered
  useEffect(() => {
    if (paused) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const id = window.setInterval(() => setSlide((i) => (i + 1) % HERO_SLIDES.length), SLIDE_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (activeTab === 'Sell') {
      router.push('/sell');
      return;
    }
    const params = new URLSearchParams();
    if (searchQuery.trim()) {
      params.set('q', searchQuery.trim());
    }
    router.push(`/properties?${params.toString()}`);
  };

  return (
    <section className="relative min-h-[850px] lg:min-h-[921px] flex items-center bg-surface-pure hero-clip pb-16 overflow-hidden">
      {/* Background slideshow with soft gradient overlay */}
      <div className="absolute inset-0 z-0">
        {HERO_SLIDES.map((item, i) => (
          <img
            key={item.src}
            src={item.src}
            alt={i === slide ? `${item.name} - Realic featured project` : ''}
            aria-hidden={i !== slide}
            fetchPriority={i === 0 ? 'high' : 'auto'}
            loading={i === 0 ? 'eager' : 'lazy'}
            decoding="async"
            className={`absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-[1400ms] ease-in-out ${
              i === slide ? 'opacity-60 lg:opacity-75' : ''
            }`}
            style={{ objectPosition: item.position }}
          />
        ))}
        {/* Clean left-to-right fade gradient so the text stays readable on every slide */}
        <div className="absolute inset-0 bg-gradient-to-r from-surface-pure via-surface-pure/90 lg:via-surface-pure/75 to-transparent" />
      </div>

      {/* Slide controls: project name + dots */}
      <div
        className="absolute bottom-6 right-4 sm:right-8 z-20 flex flex-col items-end gap-2"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <Link
          href={`/properties/${HERO_SLIDES[slide].slug}`}
          className="px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm border border-border-subtle shadow-sm text-xs font-bold text-text-high-emphasis hover:bg-white transition-colors"
        >
          {HERO_SLIDES[slide].name} &rarr;
        </Link>
        <div className="flex gap-2" role="tablist" aria-label="Hero slides">
          {HERO_SLIDES.map((item, i) => (
            <button
              key={item.slug}
              type="button"
              role="tab"
              aria-selected={i === slide}
              aria-label={`Show ${item.name}`}
              onClick={() => setSlide(i)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === slide ? 'w-7 bg-[#ea5c27]' : 'w-2.5 bg-neutral-400/70 hover:bg-neutral-500'
              }`}
            />
          ))}
        </div>
      </div>

      <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop w-full relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Brand tagline */}
          <p className="flex items-center gap-3 text-xs sm:text-sm md:text-base font-bold tracking-[0.25em] uppercase text-[#a67c00]">
            <span className="h-px w-10 sm:w-14 bg-[#a67c00]" aria-hidden="true" />
            Real Living, Better Living
          </p>

          {/* Main Title with enlarged impactful size and line break */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[76px] xl:text-[84px] font-black text-text-high-emphasis leading-[1.05] tracking-tight font-montserrat">
            Making Property Decisions Simpler.
          </h1>

          <p className="font-body-lg text-body-lg md:text-xl text-text-medium-emphasis max-w-2xl leading-relaxed">
            Realic is your real estate channel partner in Bihar, helping you explore property opportunities with clarity, informed guidance, and personalized support.
          </p>

          {/* Interactive Search Console Card */}
          <div className="bg-surface-pure rounded-xl p-6 shadow-ambient border border-border-subtle max-w-3xl mt-8">
            {/* Tabs: Buy / Sell */}
            <div className="flex gap-6 border-b border-border-subtle mb-6 pb-2 font-label-bold text-label-bold text-on-surface-variant">
              {(['Buy', 'Sell'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={`cursor-pointer pb-2 px-2 transition-colors -mb-[9px] ${
                    activeTab === tab
                      ? 'text-primary-container border-b-2 border-primary-container font-bold'
                      : 'hover:text-primary-container'
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Search Input and Terracotta CTA Button */}
            <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Patna neighborhoods (Bailey Road, Atal Path, Danapur, Digha)..."
                  className="w-full h-14 pl-12 pr-4 rounded-lg border border-border-subtle focus:border-secondary focus:ring-1 focus:ring-secondary outline-none font-body-md text-body-md bg-surface-pure text-primary placeholder:text-neutral-400"
                />
              </div>
              <button
                type="submit"
                className="bg-[#ea5c27] hover:bg-[#d64f1d] text-white font-label-bold text-label-bold h-14 px-8 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2 whitespace-nowrap cursor-pointer active:scale-95"
              >
                <span>Search Portfolio</span>
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  arrow_forward
                </span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};
