'use client';

import React from 'react';
import { REVIEWS } from '@/data/reviews';

export const HomeReviewsSection: React.FC = () => {
  return (
    <section className="bg-surface py-section-gap-sm md:py-section-gap-lg border-t border-border-subtle">
      <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 md:mb-14">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-secondary-fixed text-primary text-xs font-bold mb-3">
              <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>
                verified
              </span>
              Verified Client Feedback
            </div>
            <h2 className="font-headline-lg text-headline-lg text-primary">
              What Our Clients Say
            </h2>
            <p className="font-body-md text-body-md text-text-medium-emphasis mt-2 max-w-xl">
              Real experiences from property buyers, homeowners, and investors who trusted Realic for their property decisions in Bihar.
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center gap-4 bg-surface-pure p-4 rounded-2xl border border-border-subtle shadow-xs">
            <div className="text-3xl font-extrabold text-primary font-montserrat">4.95</div>
            <div className="border-l border-border-subtle pl-4">
              <div className="text-amber-500 text-sm">★★★★★</div>
              <p className="text-[11px] font-semibold text-text-medium-emphasis">
                480+ Verified Transactions
              </p>
            </div>
          </div>
        </div>

        {/* Reviews Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
          {REVIEWS.slice(0, 3).map((review) => (
            <div
              key={review.id}
              className="bg-surface-pure border border-border-subtle rounded-2xl p-6 sm:p-7 shadow-xs hover:shadow-ambient transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                {/* Rating & Verified badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="text-amber-500 text-sm tracking-widest">
                    {'★'.repeat(review.rating)}
                  </div>
                  {review.verifiedTransaction && (
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      <span className="material-symbols-outlined text-[13px]">check_circle</span>
                      Verified
                    </span>
                  )}
                </div>

                {/* Headline */}
                <h3 className="font-bold text-base text-primary mb-2.5 font-montserrat leading-snug">
                  &ldquo;{review.headline}&rdquo;
                </h3>

                {/* Content */}
                <p className="text-xs sm:text-sm text-text-medium-emphasis leading-relaxed mb-6">
                  {review.content}
                </p>
              </div>

              {/* Author Info */}
              <div className="pt-4 border-t border-border-subtle flex items-center gap-3">
                <img
                  src={review.avatar}
                  alt={review.author}
                  className="w-10 h-10 rounded-full object-cover border border-border-subtle"
                />
                <div>
                  <h4 className="font-bold text-xs text-primary">{review.author}</h4>
                  <p className="text-[11px] text-text-medium-emphasis">{review.role}</p>
                  <p className="text-[10px] text-neutral-400">{review.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
