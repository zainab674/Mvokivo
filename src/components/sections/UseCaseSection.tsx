import { GlassCard } from "@/components/sections/glass-card"
import { Badge } from "@/components/ui/badge"
import { Phone, MessageCircle, Users, UserCheck, TrendingUp, ArrowRight } from "lucide-react"

export const UseCaseSection = () => {
  const useCases = [
    {
      icon: TrendingUp,
      title: "Sales Teams",
      subtitle: "Close More Deals",
      description: "Boost your sales performance with AI voice agents that handle outbound calls, qualify leads, and follow up automatically.",
      benefits: [
        "Outbound calling automation",
        "Lead qualification & scoring",
        "Follow-up sequences",
        "CRM integration"
      ],
      variant: "premium" as const,
      cta: "Boost Sales"
    },
    {
      icon: MessageCircle,
      title: "Marketing Agencies",
      subtitle: "Personalized Campaigns",
      description: "Scale your marketing efforts with AI agents that deliver personalized campaign responses and nurture leads 24/7.",
      benefits: [
        "Automated campaign responses",
        "Lead nurturing sequences",
        "Personalized messaging",
        "Multi-channel follow-ups"
      ],
      variant: "enterprise" as const,
      cta: "Scale Marketing"
    },
    {
      icon: Users,
      title: "Customer Service",
      subtitle: "24/7 Support",
      description: "Provide exceptional customer service with AI agents that handle inquiries instantly and escalate when needed.",
      benefits: [
        "Instant inquiry handling",
        "24/7 availability",
        "Smart escalation",
        "Customer satisfaction tracking"
      ],
      variant: "ultra" as const,
      cta: "Enhance Support"
    },
    {
      icon: UserCheck,
      title: "Recruitment",
      subtitle: "Automated Screening",
      description: "Streamline your hiring process with AI agents that screen candidates, schedule interviews, and provide instant responses.",
      benefits: [
        "Candidate screening automation",
        "Interview scheduling",
        "Instant responses",
        "Qualification scoring"
      ],
      variant: "light" as const,
      cta: "Automate Hiring"
    }
  ]

  return (
    <section className="py-24 px-4 bg-background relative">
      <div className="absolute inset-0 bg-tech-grid opacity-10 pointer-events-none" />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-12 lg:mb-16">
          <Badge variant="secondary" className="neon-border bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300 mb-6 text-primary">
            <Users className="w-4 h-4 mr-2" />
            Use Cases
          </Badge>
          <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-6 text-white text-shadow-glow">
            Perfect for Every Agency Need
          </h2>
          <p className="text-lg md:text-xl font-light leading-relaxed text-muted-foreground max-w-3xl mx-auto">
            Our white-label AI voice agents are designed to excel across all business functions.
            Choose your focus area and watch your agency deliver exceptional results for clients.
          </p>
        </div>

        {/* Use Cases Grid - Tech Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {useCases.map((useCase, index) => {
            const Icon = useCase.icon
            return (
              <div
                key={index}
                className="robotics-card-angled bg-card/40 hover:bg-card/60 p-8 group relative"
              >
                {/* Background Tech Elements */}
                <div className="absolute right-0 top-0 w-24 h-24 bg-gradient-to-bl from-primary/10 to-transparent pointer-events-none" />

                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-8">
                    <div className="p-3 bg-primary/20 border border-primary/40 neon-border">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    {index === 0 && (
                      <Badge variant="outline" className="text-xs text-primary bg-primary/10 border-primary">
                        Most Popular
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-4 mb-8">
                    <div>
                      <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wider">
                        {useCase.title}
                      </h3>
                      <div className="text-lg font-mono text-primary/80">
                        {useCase.subtitle}
                      </div>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">
                      {useCase.description}
                    </p>
                  </div>

                  {/* Benefits List */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-8">
                    {useCase.benefits.map((benefit, benefitIndex) => (
                      <div key={benefitIndex} className="flex items-center gap-2 text-sm text-gray-400">
                        <div className="w-1 h-1 bg-primary box-shadow-glow" />
                        <span>{benefit}</span>
                      </div>
                    ))}
                  </div>

                  {/* CTA Button */}
                  <button className="w-full py-3 btn-robotics bg-transparent border border-primary text-primary hover:bg-primary hover:text-primary-foreground flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_hsl(var(--primary)/0.4)]">
                    {useCase.cta}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <div className="hud-frame inline-block p-8 bg-black/40 backdrop-blur-sm">
            <p className="text-lg font-light leading-relaxed mb-6 text-white">
              <span className="text-primary font-bold">Ready to transform your agency operations?</span>
              <br />
              See how our AI voice agents can work for your specific use case.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="px-8 py-3 btn-robotics bg-primary text-primary-foreground font-bold shadow-lg hover:shadow-primary/50">
                Schedule Demo
              </button>
              <button className="px-8 py-3 btn-robotics bg-transparent border border-primary/50 text-primary hover:bg-primary/10">
                View All Features
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}