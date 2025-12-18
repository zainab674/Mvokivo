

import React from 'react';
import { Navbar } from "@/components/landing-new/Navbar";
import { Hero } from "@/components/landing-new/Hero";
import { DetailedFeatures } from "@/components/landing-new/DetailedFeatures";
import { TabbedFeatures } from "@/components/landing-new/TabbedFeatures";
import { ActionSection } from "@/components/landing-new/ActionSection";
import { FeaturesGrid } from "@/components/landing-new/FeaturesGrid";
import { FAQ } from "@/components/landing-new/FAQ";
import { Footer } from "@/components/landing-new/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans selection:bg-purple-200 selection:text-purple-900">
      <Navbar />
      <Hero />
      <DetailedFeatures />
      <TabbedFeatures />
      <ActionSection />
      <FeaturesGrid />
      <FAQ />
      <Footer />
    </div>
  );
};

export default LandingPage;

