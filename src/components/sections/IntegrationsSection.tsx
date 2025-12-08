import { GlassCard } from "@/components/sections/glass-card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Mic, Clock } from "lucide-react"
import {
  siSlack,
  siHubspot,
  siSalesforce,
  siGooglecalendar,
  siZapier,
  siCalendly,
  siMake
} from 'simple-icons'

const IntegrationsSection = () => {
  const integrationApps = [
    {
      name: "Slack",
      position: "top-6 left-6",
      icon: siSlack,
      color: "#E01E5A"
    },
    {
      name: "HubSpot",
      position: "top-6 right-6",
      icon: siHubspot,
      color: "#FF7A59"
    },
    {
      name: "Zapier",
      position: "right-6 top-1/2 -translate-y-1/2",
      icon: siZapier,
      color: "#FF4A00"
    },
    {
      name: "Salesforce",
      position: "bottom-6 right-6",
      icon: siSalesforce,
      color: "#00A1E0"
    },
    {
      name: "Google Calendar",
      position: "bottom-6 left-6",
      icon: siGooglecalendar,
      color: "#4285F4"
    },
    {
      name: "Cal.com",
      position: "left-6 top-1/2 -translate-y-1/2",
      icon: siCalendly,
      color: "#006BFF"
    },
    {
      name: "Make",
      position: "top-6 left-1/2 -translate-x-1/2",
      icon: siMake,
      color: "#6B46C1"
    },
    {
      name: "GoHighLevel",
      position: "bottom-6 left-1/2 -translate-x-1/2",
      icon: null,
      color: "#7C3AED"
    }
  ]

  const features = [
    {
      icon: Zap,
      title: "Smart Templates",
      description: "Pre-built conversation flows that adapt to your business needs automatically",
      gradient: "from-blue-500/20 to-purple-500/20"
    },
    {
      icon: Mic,
      title: "Auto Call Recording",
      description: "Capture every conversation with premium analytics and searchable transcripts",
      gradient: "from-green-500/20 to-blue-500/20"
    },
    {
      icon: Clock,
      title: "Scheduled Actions",
      description: "Automate follow-ups, reminders, and outreach based on conversation outcomes",
      gradient: "from-purple-500/20 to-pink-500/20"
    }
  ]

  return (
    <section className="py-16 lg:py-20 bg-background relative overflow-hidden">
      <div className="absolute inset-0 bg-tech-grid opacity-20 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent pointer-events-none" />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <Badge variant="secondary" className="neon-border bg-black/50 backdrop-blur-md shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all duration-300 mb-6 text-primary">
            <Zap className="w-4 h-4 mr-2" />
            Integrations
          </Badge>
          <h2 className="text-5xl md:text-7xl font-bold tracking-tight leading-tight mb-4 text-white text-shadow-glow">
            Automate your <span className="text-primary animate-glitch" data-text="workflow">workflow</span>
          </h2>
          <p className="text-base font-normal leading-relaxed text-muted-foreground max-w-2xl mx-auto">
            Connect your AI voice agent to the tools you already use. Get enterprise-grade integrations
            without the complexity - designed for individuals who want professional results.
          </p>
        </div>

        {/* Central Integration Hub */}
        <div className="mb-20">
          <div className="relative mx-auto w-80 h-80 flex items-center justify-center">
            {/* Central Hub */}
            <div className="rounded-full border border-primary/50 bg-black/80 backdrop-blur-md shadow-[0_0_50px_rgba(0,243,255,0.2)] w-32 h-32 flex items-center justify-center relative z-10 p-6 neon-border animate-pulse-slow">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-lg flex items-center justify-center">
                  <Zap className="w-8 h-8 text-primary drop-shadow-[0_0_10px_rgba(0,243,255,0.8)]" />
                </div>
                <span className="text-xs font-mono font-bold text-primary uppercase tracking-widest">AI Core</span>
              </div>
            </div>

            {/* Connection Lines */}
            <div className="absolute inset-0 z-0">
              {integrationApps.map((app, index) => (
                <div
                  key={app.name}
                  className={`absolute w-0.5 h-16 bg-gradient-to-t from-primary/80 to-transparent transform origin-bottom ${app.position} neon-border-sharp`}
                  style={{
                    transform: `rotate(${(index * 45) - 90}deg)`,
                    boxShadow: '0 0 10px rgba(0,243,255,0.5)'
                  }}
                />
              ))}
            </div>

            {/* App Icons */}
            {integrationApps.map((app) => (
              <div
                key={app.name}
                className={`absolute ${app.position} transform -translate-x-1/2 -translate-y-1/2`}
              >
                <div className="rounded-xl border border-primary/30 bg-black/60 backdrop-blur-md shadow-lg w-16 h-16 flex items-center justify-center hover:scale-110 hover:border-primary hover:shadow-[0_0_20px_rgba(0,243,255,0.4)] transition-all duration-300 cursor-pointer p-3 group">
                  {app.icon ? (
                    <svg
                      role="img"
                      viewBox="0 0 24 24"
                      className="w-full h-full text-gray-400 group-hover:text-white transition-colors"
                      fill="currentColor"
                    >
                      <path d={app.icon.path} />
                    </svg>
                  ) : (
                    <span className="text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                      GHL
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
          {features.map((feature, index) => (
            <div key={feature.title} className="robotics-card p-6 text-center group hover:-translate-y-2 transition-transform duration-300">
              <div className={`w-16 h-16 mx-auto mb-4 rounded-none bg-primary/10 border border-primary/20 neon-border flex items-center justify-center`}>
                <feature.icon className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button size="lg" className="btn-robotics bg-primary text-primary-foreground font-bold px-8 py-6 text-lg hover:shadow-[0_0_30px_rgba(0,243,255,0.4)]">
            Explore All Integrations
          </Button>
        </div>
      </div>
    </section>
  )
}

export { IntegrationsSection }