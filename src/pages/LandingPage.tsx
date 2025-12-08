
import { FeatureShowcase } from "@/components/sections/FeatureShowcase";
import { FinalCTASection } from "@/components/sections/FinalCTASection";
import { HeroSection } from "@/components/sections/HeroSection";
import { IntegrationsSection } from "@/components/sections/IntegrationsSection";

import { PricingSection } from "@/components/sections/PricingSection";
import { UseCaseSection } from "@/components/sections/UseCaseSection";
import { ValuePropositionSection } from "@/components/sections/ValuePropositionSection";
import { WhiteLabelSection } from "@/components/sections/WhiteLabelSection";
import { FloatingNav } from "@/components/ui/floating-nav";
import { TopCTA } from "@/components/ui/top-cta";

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      <FloatingNav />
      <TopCTA />

      {/* Hero - Dark Tech Grid */}
      <div className="relative bg-tech-grid">
        <HeroSection />
      </div>



      {/* Use Cases - Tech Background */}
      <div className="bg-background text-foreground relative">
        <div className="absolute inset-0 bg-tech-grid opacity-50 pointer-events-none" />
        <UseCaseSection />
      </div>

      {/* Value Proposition - Black */}
      <div className="bg-black text-foreground border-y border-primary/10">
        <ValuePropositionSection />
      </div>

      {/* Feature Showcase - Dark */}
      <div className="bg-background text-foreground">
        <FeatureShowcase />
      </div>

      {/* White-Label - Dark */}
      <div className="bg-background text-foreground relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent opacity-50 pointer-events-none" />
        <WhiteLabelSection />
      </div>

      {/* Integrations - Dark */}
      <div className="bg-black/50 text-foreground border-y border-primary/10">
        <IntegrationsSection />
      </div>

      {/* Pricing - Dark */}
      {/* <div id="pricing" className="bg-background text-foreground relative">
        <div className="absolute inset-0 bg-tech-grid opacity-30 pointer-events-none" />
        <PricingSection />
      </div> */}

      {/* Final CTA - Dark Brand */}
      <div className="bg-primary/5 text-foreground border-t border-primary/20">
        <FinalCTASection />
      </div>
    </div>
  );
};

export default LandingPage;
