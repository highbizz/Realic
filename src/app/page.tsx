import React from 'react';
import { connection } from 'next/server';
import { getAllProperties } from '@/data/store';
import { HeroSection } from '@/components/HeroSection';
import { TrustPillarsSection } from '@/components/TrustPillarsSection';
import { CuratedEstatesSection } from '@/components/CuratedEstatesSection';
import { MortgageCalculatorSection } from '@/components/MortgageCalculatorSection';
import { NeighborhoodInsightsSection } from '@/components/NeighborhoodInsightsSection';
import { HomeReviewsSection } from '@/components/HomeReviewsSection';

export default async function HomePage() {
  // Render per request so properties edited in the admin show up immediately.
  await connection();
  const properties = getAllProperties();

  return (
    <div className="flex flex-col">
      {/* 1. Hero Section (Asymmetrical Split with Copy & High-Fidelity Imagery) */}
      <HeroSection />

      {/* 2. Three Pillars of Trust Section */}
      <TrustPillarsSection />

      {/* 3. Curated Estates Section */}
      <CuratedEstatesSection properties={properties} />

      {/* 4. Plan Your Future Home (Loan Parameters & Estimated Monthly Payment) */}
      <MortgageCalculatorSection />

      {/* 5. Neighborhood Insights Bento Grid (South Delhi, Bandra West, Whitefield) */}
      <NeighborhoodInsightsSection />

      {/* 6. Verified Client Reviews & Endorsements */}
      <HomeReviewsSection />
    </div>
  );
}
