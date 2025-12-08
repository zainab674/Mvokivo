import { GlassCard } from "@/components/sections/glass-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Palette,
  Crown,
  ArrowRight,
  Check,
  Zap,
  TrendingUp
} from "lucide-react"

export const WhiteLabelSection = () => {
  const partnerBenefits = [
    {
      icon: Zap,
      metric: "0%",
      label: "Technical Overhead",
      description: "No developers or technical team needed"
    },
    {
      icon: TrendingUp,
      metric: "3x",
      label: "Client LTV",
      description: "AI voice agents increase client retention"
    },
    {
      icon: Palette,
      metric: "100%",
      label: "Custom Branding",
      description: "Complete white-label solution with your brand"
    }
  ]

  return (
    <section className="py-24 px-4 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-tech-grid opacity-10 pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge variant="secondary" className="neon-border bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300 mb-6 text-primary">
            <Crown className="w-4 h-4 mr-2" />
            White-Label Solution
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white text-shadow-glow">
            Your Brand<br />
            <span className="text-primary animate-glitch" data-text="Our Technology">Our Technology</span>
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Launch your own AI voice agent platform under your brand. Our complete white-label solution
            gives you everything needed to offer enterprise-grade voice AI to your clients.
          </p>
        </div>

        {/* Partner Benefits */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {partnerBenefits.map((benefit, index) => {
            const Icon = benefit.icon
            return (
              <div key={index} className="robotics-card text-center p-8 group hover:scale-105 transition-transform duration-300">
                <div className="inline-flex p-4 bg-primary/10 border border-primary/20 neon-border mb-6 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-4xl font-mono font-bold text-primary mb-3 text-shadow-glow">
                  {benefit.metric}
                </div>
                <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">
                  {benefit.label}
                </h3>
                <p className="text-base font-normal leading-relaxed text-gray-400">
                  {benefit.description}
                </p>
              </div>
            )
          })}
        </div>


        {/* Partnership CTA */}
        <div className="text-center">
          <div className="hud-frame relative overflow-hidden p-12 bg-black/60 backdrop-blur-md">
            {/* Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none" />

            <div className="relative z-10">
              <h3 className="text-3xl font-light mb-4 text-white">
                Become a <span className="text-primary font-bold">White-Label Partner</span>
              </h3>
              <p className="text-lg md:text-xl font-light leading-relaxed text-gray-400 mb-8 max-w-2xl mx-auto">
                Launch your AI voice agent service in 48 hours. No technical team required,
                no development costs. Start capturing new revenue opportunities immediately.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
                <Button size="lg" className="px-8 py-4 btn-robotics bg-primary text-primary-foreground font-bold text-lg hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
                  Apply for Partnership
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                <Button variant="outline" size="lg" className="px-8 py-4 btn-robotics bg-transparent border border-primary/50 text-primary text-lg hover:bg-primary/10">
                  Schedule Partnership Call
                </Button>
              </div>

              <div className="flex items-center justify-center gap-6 text-sm text-gray-500 flex-wrap">
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Dedicated partner manager</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Technical onboarding support</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  <span>Marketing co-op programs</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}