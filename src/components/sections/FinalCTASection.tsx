import { ArrowRight, Check } from "lucide-react"

export const FinalCTASection = () => {
  return (
    <section className="py-24 px-4 bg-gradient-to-t from-background to-black relative">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="hud-frame p-12 bg-card/10 backdrop-blur-md">
          {/* Headline */}
          <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight text-white tracking-tight">
            Ready to Transform Your
            <br />
            <span className="text-primary animate-glitch" data-text="Customer Experience?">Customer Experience?</span>
          </h2>

          {/* Subheading */}
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto leading-relaxed">
            Join thousands of businesses already using AI voice agents to drive growth.
            No setup fees, no hidden costs, and no risk with our 30-day guarantee.
          </p>

          {/* Primary CTAs */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
            <button className="group px-8 py-4 btn-robotics bg-primary text-primary-foreground rounded-none font-bold text-lg hover:shadow-[0_0_20px_hsl(var(--primary)/0.6)]">
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 inline group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="px-8 py-4 btn-robotics bg-transparent border border-primary/50 text-primary rounded-none font-bold text-lg hover:bg-primary/10">
              Get Personalized Demo
            </button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-8 text-sm text-gray-400">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Start your risk-free trial today</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Setup in under 5 minutes</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-primary" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}