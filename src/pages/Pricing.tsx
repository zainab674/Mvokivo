import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Calculator, ArrowRight, ArrowLeft } from "lucide-react";
import { PLAN_CONFIGS } from "@/lib/plan-config";
import { Footer } from "@/components/sections/Footer";

export default function Pricing() {
  // Map plan configs to pricing page format
  const plans = [
    {
      name: PLAN_CONFIGS.starter.name,
      price: `$${PLAN_CONFIGS.starter.price}`,
      period: "/month",
      description: "Perfect for small businesses getting started with AI voice agents",
      features: PLAN_CONFIGS.starter.features,
      roi: "$2,500",
      roiLabel: "Monthly ROI",
      popular: false
    },
    {
      name: PLAN_CONFIGS.professional.name,
      price: `$${PLAN_CONFIGS.professional.price}`,
      period: "/month",
      description: "Advanced features for growing teams that need more power",
      features: PLAN_CONFIGS.professional.features,
      roi: "$8,500",
      roiLabel: "Monthly ROI",
      popular: true
    },
    {
      name: PLAN_CONFIGS.enterprise.name,
      price: "Custom",
      period: "",
      description: "Tailored solutions for large organizations with custom needs",
      features: PLAN_CONFIGS.enterprise.features,
      roi: "$50,000+",
      roiLabel: "Monthly ROI",
      popular: false
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Hero Section */}
      <div className="relative bg-tech-grid border-b border-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          {/* Back Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors mb-8 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Back to Home</span>
          </Link>

          <div className="text-center">
            <Badge variant="secondary" className="neon-border bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300 mb-6 text-primary">
              <Calculator className="w-4 h-4 mr-2" />
              ROI-Focused Pricing
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 text-white text-shadow-glow">
              Pricing That Scales
              <br />
              <span className="text-primary animate-glitch" data-text="With Your Success">With Your Success</span>
            </h1>
            <p className="text-lg md:text-xl font-light leading-relaxed text-muted-foreground max-w-3xl mx-auto mb-8">
              Every plan pays for itself. Our customers typically see 300-500% ROI within the first quarter.
            </p>

            {/* ROI Calculator Teaser */}
            <div className="hud-frame inline-block mb-8 p-4">
              <div className="flex items-center gap-3">
                <Calculator className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-foreground">Calculate your potential ROI</span>
                <button className="px-3 py-1 bg-primary text-primary-foreground text-xs rounded-none hover:bg-primary/90 transition-colors">
                  Free Calculator
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 px-4 relative bg-background">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`robotics-card bg-card/50 backdrop-blur-md transition-all duration-300 hover:scale-105 relative p-6 ${plan.popular ? 'neon-border scale-105' : 'border border-border'}`}
              >
                {/* Popular Badge */}
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 mr-1" />
                      Most Popular
                    </Badge>
                  </div>
                )}

                {/* Plan Header */}
                <div className="text-center mb-6">
                  <h3 className="text-xl font-light text-foreground mb-2">{plan.name}</h3>
                  <div className="flex items-end justify-center gap-1 mb-3">
                    <span className="text-4xl font-extralight text-primary">{plan.price}</span>
                    <span className="text-sm text-muted-foreground mb-1">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                {/* ROI Highlight */}
                <div className="text-center mb-6">
                  <Badge variant="outline" className="bg-success/10 border-success/30 text-success rounded-none">
                    {plan.roi} {plan.roiLabel}
                  </Badge>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-none border border-primary/30 flex items-center justify-center flex-shrink-0">
                        <Check className="w-3 h-3 text-primary" />
                      </div>
                      <span className="text-sm text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Button */}
                <Link
                  to="/signup"
                  className={`w-full py-3 rounded-none font-medium transition-all duration-300 block text-center ${plan.popular
                    ? 'btn-robotics bg-primary text-primary-foreground shadow-lg hover:shadow-xl'
                    : 'border border-primary/30 text-primary hover:bg-primary/10'
                    }`}
                >
                  {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
                  {plan.price !== "Custom" && <ArrowRight className="w-4 h-4 inline ml-2" />}
                </Link>

                {/* Money-back guarantee */}
                <p className="text-xs text-center text-muted-foreground mt-3">
                  30-day money-back guarantee
                </p>
              </div>
            ))}
          </div>

          {/* Additional Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            <div className="robotics-card bg-card/30 p-6 text-center">
              <Zap className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-medium text-foreground mb-2">Setup in Minutes</h4>
              <p className="text-sm text-muted-foreground">No technical expertise required. We handle the setup for you.</p>
            </div>

            <div className="robotics-card bg-card/30 p-6 text-center">
              <Crown className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-medium text-foreground mb-2">No Long-term Contracts</h4>
              <p className="text-sm text-muted-foreground">Cancel anytime. Month-to-month flexibility with enterprise security.</p>
            </div>

            <div className="robotics-card bg-card/30 p-6 text-center">
              <Star className="w-8 h-8 text-primary mx-auto mb-3" />
              <h4 className="font-medium text-foreground mb-2">Dedicated Success Manager</h4>
              <p className="text-sm text-muted-foreground">Personal support to maximize your ROI and growth potential.</p>
            </div>
          </div>

          {/* FAQ Section */}
          <div className="mt-24">
            <h2 className="text-3xl font-bold text-center mb-12 text-white">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
              <div className="robotics-card bg-card/30 p-6">
                <h4 className="font-semibold text-foreground mb-2">Can I change plans later?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate the difference.
                </p>
              </div>
              <div className="robotics-card bg-card/30 p-6">
                <h4 className="font-semibold text-foreground mb-2">What payment methods do you accept?</h4>
                <p className="text-sm text-muted-foreground">
                  We accept all major credit cards and process payments securely through Paddle.com, our Merchant of Record.
                </p>
              </div>
              <div className="robotics-card bg-card/30 p-6">
                <h4 className="font-semibold text-foreground mb-2">Is there a free trial?</h4>
                <p className="text-sm text-muted-foreground">
                  Yes! All plans come with a 30-day money-back guarantee. Try our service risk-free and get a full refund if you're not satisfied.
                </p>
              </div>
              <div className="robotics-card bg-card/30 p-6">
                <h4 className="font-semibold text-foreground mb-2">How are minutes billed?</h4>
                <p className="text-sm text-muted-foreground">
                  Minutes are purchased separately and billed based on usage. You only pay for what you use, with no hidden fees.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-primary/5 text-foreground border-t border-primary/20 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using AI voice agents to drive growth.
            Start your free trial today, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/signup"
              className="px-8 py-4 btn-robotics bg-primary text-primary-foreground rounded-none font-bold text-lg hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)] inline-flex items-center justify-center"
            >
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2" />
            </Link>
            <Link
              to="/"
              className="px-8 py-4 btn-robotics bg-transparent border border-primary/50 text-primary rounded-none font-bold text-lg hover:bg-primary/10 inline-flex items-center justify-center"
            >
              Learn More
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <Footer />
    </div>
  );
}

