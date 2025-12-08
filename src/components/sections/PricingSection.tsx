import { GlassCard } from "@/components/sections/glass-card"
import { Badge } from "@/components/ui/badge"
import { Check, Star, Zap, Crown, Calculator } from "lucide-react"
import { PLAN_CONFIGS } from "@/lib/plan-config"

export const PricingSection = () => {
  // Map plan configs to pricing section format
  // Note: This section uses different pricing/ROI values for marketing purposes
  // If you want to use the same prices as plan-config.ts, replace the price values below
  const plans = [
    {
      name: PLAN_CONFIGS.starter.name,
      price: `$${PLAN_CONFIGS.starter.price}`,
      period: "/month",
      description: "Perfect for small businesses getting started with AI voice agents",
      variant: "default" as const,
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
      variant: "premium" as const,
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
      variant: "enterprise" as const,
      features: PLAN_CONFIGS.enterprise.features,
      roi: "$50,000+",
      roiLabel: "Monthly ROI",
      popular: false
    }
  ]

  return (
    <section className="py-24 px-4 relative">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="neon-border bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300 mb-6 text-primary">
            <Calculator className="w-4 h-4 mr-2" />
            ROI-Focused Pricing
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white text-shadow-glow">
            Pricing That Scales
            <br />
            <span className="text-primary animate-glitch" data-text="With Your Success">With Your Success</span>
          </h2>
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
              <button className={`w-full py-3 rounded-none font-medium transition-all duration-300 ${plan.popular
                ? 'btn-robotics bg-primary text-primary-foreground shadow-lg hover:shadow-xl'
                : 'border border-primary/30 text-primary hover:bg-primary/10'
                }`}>
                {plan.price === "Custom" ? "Contact Sales" : "Start Free Trial"}
              </button>

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

      </div>
    </section>
  )
}