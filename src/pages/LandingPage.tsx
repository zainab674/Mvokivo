

import React from 'react';
import { Navbar } from "@/components/landing-new/Navbar";
import { VapiHero } from "@/components/landing-new/VapiHero";
import { DetailedFeatures } from "@/components/landing-new/DetailedFeatures";
import { TabbedFeatures } from "@/components/landing-new/TabbedFeatures";
import { ActionSection } from "@/components/landing-new/ActionSection";
import { FeaturesGrid } from "@/components/landing-new/FeaturesGrid";
import { FAQ } from "@/components/landing-new/FAQ";
import { Footer } from "@/components/landing-new/Footer";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans selection:bg-blue-500/30 selection:text-white">
      <Navbar />
      <VapiHero />
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

