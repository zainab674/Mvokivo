import { GlassCard } from "@/components/sections/glass-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Bot, Clock, Target, Zap, Phone, Settings, Users, Gauge } from "lucide-react";

export const ValuePropositionSection = () => {
  const valueProps = [{
    icon: Clock,
    title: "Setup in Minutes",
    subtitle: "Get started instantly",
    description: "Build and deploy AI voice agents in under 5 minutes. No technical expertise required. Start capturing leads today with our intuitive drag-and-drop builder.",
    benefits: ["Drag-and-drop builder", "Pre-built templates", "Instant deployment", "No coding required"],
    metric: "5-min setup",
    bgColor: "from-blue-500/10 to-purple-500/10",
    visualIcon: Settings
  }, {
    icon: Bot,
    title: "Never Miss a Call",
    subtitle: "24/7 availability",
    description: "Your AI agents work around the clock, answering every call instantly. Capture leads while you sleep and your competitors miss opportunities.",
    benefits: ["24/7 availability", "Instant response", "Multi-call handling", "Zero missed opportunities"],
    metric: "100% coverage",
    bgColor: "from-green-500/10 to-emerald-500/10",
    visualIcon: Phone
  }, {
    icon: Target,
    title: "White-Label Solution",
    subtitle: "Your brand, your success",
    description: "Completely customizable and brandable. Your clients will never know it's not your own proprietary technology. Build your agency with confidence.",
    benefits: ["Custom branding", "Your domain", "White-label dashboard", "Reseller opportunities"],
    metric: "100% branded",
    bgColor: "from-orange-500/10 to-red-500/10",
    visualIcon: Users
  }, {
    icon: Zap,
    title: "Seamless Integrations",
    subtitle: "Connect everything",
    description: "Connect with 100+ tools including CRMs, calendars, payment systems, and marketing platforms. Data flows automatically where you need it.",
    benefits: ["100+ integrations", "Real-time sync", "API connectivity", "Workflow automation"],
    metric: "100+ tools",
    bgColor: "from-purple-500/10 to-pink-500/10",
    visualIcon: Gauge
  }];

  return (
    <section className="py-24 relative overflow-hidden bg-background">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-24">
          <Badge variant="secondary" className="neon-border bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300 mb-6 text-primary">
            <Target className="w-4 h-4 mr-2" />
            Core Value Propositions
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white text-shadow-glow">
            Connect with Customers
            <br />
            <span className="text-primary animate-glitch" data-text="Effortlessly">Effortlessly</span>
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Build, brand, and deploy intelligent voice agents that work around the clock. From setup to success in minutes, not months.
          </p>
        </div>

        {/* True Zigzag Feature Sections */}
        <div className="space-y-0">
          {valueProps.map((prop, index) => {
            const Icon = prop.icon;
            const VisualIcon = prop.visualIcon;
            const isEven = index % 2 === 0;

            return (
              <section key={index} className={`relative py-24 ${index > 0 ? 'border-t border-primary/10' : ''}`}>
                {/* Content Container */}
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                  <div className={`flex flex-col lg:flex-row items-center gap-16 ${!isEven ? 'lg:flex-row-reverse' : ''}`}>
                    {/* Content Side */}
                    <div className="flex-1 space-y-8">
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <div className="p-4 rounded-none bg-primary/10 border border-primary/20 neon-border">
                            <Icon className="w-8 h-8 text-primary" />
                          </div>
                          <Badge variant="outline" className="bg-primary/10 border-primary/40 text-primary font-mono tracking-wider">
                            {prop.metric}
                          </Badge>
                        </div>

                        <div className="space-y-2">
                          <p className="text-primary text-sm font-bold uppercase tracking-widest text-shadow-glow">
                            {prop.subtitle}
                          </p>
                          <h3 className="text-4xl lg:text-5xl font-bold text-white mb-4">
                            {prop.title}
                          </h3>
                        </div>

                        <p className="text-xl text-muted-foreground leading-relaxed max-w-xl">
                          {prop.description}
                        </p>
                      </div>

                      {/* Benefits List */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {prop.benefits.map((benefit, benefitIndex) => (
                          <div key={benefitIndex} className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-primary shadow-[0_0_5px_hsl(var(--primary))]" />
                            <span className="text-gray-400 font-mono text-sm">{benefit}</span>
                          </div>
                        ))}
                      </div>

                      {/* CTA */}
                      <Button variant="outline" className="group bg-transparent border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground btn-robotics">
                        Learn More
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>

                    {/* Visual Side */}
                    <div className="flex-1">
                      <div className="robotics-card p-12 group hover:shadow-[0_0_30px_rgba(0,243,255,0.15)] transition-all duration-500">
                        <div className="flex items-center justify-center h-80 relative overflow-hidden">
                          <div className="absolute inset-0 bg-primary/5 grid-tech opacity-50" />
                          <div className="relative p-8 border border-primary/30 bg-black/40 backdrop-blur-sm neon-border rotate-3 transition-transform duration-500 group-hover:rotate-0 group-hover:scale-105">
                            <VisualIcon className="w-32 h-32 text-primary drop-shadow-[0_0_15px_rgba(0,243,255,0.5)]" />
                          </div>
                        </div>

                        {/* Floating Elements */}
                        <div className="absolute top-8 right-8 p-3 bg-black/60 border border-primary/40 backdrop-blur-md">
                          <Icon className="w-6 h-6 text-primary animate-pulse" />
                        </div>

                        <div className="absolute bottom-8 left-8 px-4 py-2 bg-primary/20 border border-primary text-primary font-mono text-xs tracking-wider">
                          SYSTEM: {prop.metric}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </section>
  );
};