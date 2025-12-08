import { GlassCard } from "@/components/sections/glass-card";
import { Badge } from "@/components/ui/badge";
import { Play, Mic, Brain, Zap, Globe, Settings, ArrowRight } from "lucide-react";
export const FeatureShowcase = () => {
  const features = [{
    icon: Brain,
    title: "Advanced AI Intelligence",
    description: "Natural language processing that understands context, emotions, and intent with human-like precision.",
    benefits: ["95% conversation accuracy", "Context-aware responses", "Emotional intelligence", "Learning from interactions"],
    demo: "Watch AI Demo"
  }, {
    icon: Mic,
    title: "Voice Synthesis",
    description: "Crystal-clear, natural voice that adapts tone and pace to match your brand personality.",
    benefits: ["Multiple voice options", "Brand voice training", "Accent customization"],
    demo: "Hear Voice Samples"
  }, {
    icon: Zap,
    title: "Instant Integration",
    description: "Connect with your existing tools and workflows in minutes, not months.",
    benefits: ["200+ integrations", "API-first approach", "Real-time sync"],
    demo: "View Integrations"
  }, {
    icon: Globe,
    title: "Global Reach",
    description: "Support customers worldwide with multi-language capabilities and timezone intelligence.",
    benefits: ["50+ languages", "Regional accents", "Cultural awareness"],
    demo: "Language Demo"
  }, {
    icon: Settings,
    title: "Custom Workflows",
    description: "Build sophisticated conversation flows that guide customers exactly where you want them.",
    benefits: ["Visual flow builder", "Conditional logic", "A/B testing"],
    demo: "Builder Tour"
  }];
  return <section className="py-24 px-4 relative bg-background">
    {/* Background Effects */}
    <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />

    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
      {/* Section Header */}
      <div className="text-center mb-16">
        <Badge variant="secondary" className="neon-border bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300 mb-6 text-primary">
          <Zap className="w-4 h-4 mr-2" />
          Advanced Features
        </Badge>
        <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white text-shadow-glow">
          Enterprise-Grade AI
          <br />
          <span className="text-primary animate-glitch" data-text="That Actually Works">That Actually Works</span>
        </h2>
        <p className="text-lg md:text-xl font-light leading-relaxed text-muted-foreground max-w-3xl mx-auto">
          Built for scale, designed for results. Every feature is engineered to drive conversions and deliver exceptional customer experiences.
        </p>
      </div>

      {/* Feature Grid - Asymmetrical Layout */}
      <div className="grid-tech-asym mb-16">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return <div key={index} className={`robotics-card-angled robotics-hover-reveal group p-8 ${index === 0 ? 'neon-border' : ''}`}>

            <div className="relative z-10">
              {/* Icon Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="p-4 rounded-none bg-primary/10 border border-primary/20 group-hover:scale-110 transition-transform duration-300 neon-border">
                  <Icon className="w-8 h-8 text-primary group-hover:animate-pulse" />
                </div>
                {index === 0 && <Badge variant="outline" className="bg-primary/20 border-primary text-primary">
                  Core Feature
                </Badge>}
              </div>

              {/* Content */}
              <h3 className="text-xl font-bold text-white mb-3 tracking-wide">
                {feature.title}
              </h3>
              <p className="text-base font-normal leading-relaxed text-muted-foreground mb-6">
                {feature.description}
              </p>

              {/* Benefits List */}
              <div className="space-y-2 mb-8">
                {feature.benefits.map((benefit, benefitIndex) => <div key={benefitIndex} className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-primary shadow-[0_0_5px_hsl(var(--primary))]" />
                  <span className="text-sm text-gray-400 font-mono">{benefit}</span>
                </div>)}
              </div>

              {/* Demo Button */}
              <button className="group/btn flex items-center gap-2 text-primary font-bold text-sm hover:text-white transition-colors uppercase tracking-wider">
                <Play className="w-4 h-4" />
                <span>{feature.demo}</span>
                <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>;
        })}
      </div>

    </div>
  </section>;
};