
import React from 'react';
import { Link } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap, Crown, Calculator, ArrowRight, ArrowLeft } from "lucide-react";
import { PLAN_CONFIGS } from "@/lib/plan-config";
import { Footer } from "@/components/landing-new/Footer";
import { Navbar } from "@/components/landing-new/Navbar";
import { motion } from "framer-motion";

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
      popular: false,
      color: "from-blue-500/20"
    },
    {
      name: PLAN_CONFIGS.professional.name,
      price: `$${PLAN_CONFIGS.professional.price}`,
      period: "/month",
      description: "Advanced features for growing teams that need more power",
      features: PLAN_CONFIGS.professional.features,
      roi: "$8,500",
      roiLabel: "Monthly ROI",
      popular: true,
      color: "from-pink-500/20"
    },
    {
      name: PLAN_CONFIGS.enterprise.name,
      price: "Custom",
      period: "",
      description: "Tailored solutions for large organizations with custom needs",
      features: PLAN_CONFIGS.enterprise.features,
      roi: "$50,000+",
      roiLabel: "Monthly ROI",
      popular: false,
      color: "from-purple-500/20"
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-x-hidden font-sans">
      <Navbar />

      {/* Hero Section */}
      <div className="relative pt-44 pb-24 border-b border-white/5 overflow-hidden">
        <div className="absolute top-0 right-0 w-[50%] h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent opacity-50"></div>

        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24 relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-block px-4 py-1.5 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-8 border border-pink-500/20">
              Neural Investment
            </div>
            <h1 className="text-5xl md:text-8xl font-bold tracking-tighter mb-8 leading-[0.85]">
              PRICING THAT <br />
              <span className="text-white/20">SCALES WITH SUCCESS</span>
            </h1>
            <p className="text-white/40 text-lg md:text-xl font-light leading-relaxed max-w-2xl mx-auto mb-12">
              Every node pays for itself. Our neural architecture typically delivers 300-500% ROI within the first deployment cycle.
            </p>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div className="py-24 px-6 relative">
        <div className="max-w-7xl mx-auto px-6 md:px-12 lg:px-24">
          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-32">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`group relative bg-[#0a0b12] rounded-[3rem] border transition-all duration-500 overflow-hidden flex flex-col ${plan.popular ? 'border-pink-500/50 scale-105 shadow-[0_0_50px_rgba(236,72,153,0.15)] z-20' : 'border-white/5 hover:border-white/10 shadow-2xl'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${plan.color} to-transparent opacity-30 group-hover:opacity-50 transition-opacity`}></div>

                <div className="p-10 relative z-10 flex-grow flex flex-col">
                  {plan.popular && (
                    <div className="absolute top-6 right-6">
                      <div className="px-3 py-1 bg-pink-500 text-white text-[10px] font-mono font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                        Active Peak
                      </div>
                    </div>
                  )}

                  <div className="mb-10">
                    <h3 className="text-sm font-mono text-white/30 tracking-[0.3em] uppercase mb-4">{plan.name}</h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-5xl font-bold tracking-tighter text-white">{plan.price}</span>
                      <span className="text-sm font-mono text-white/20 tracking-widest uppercase">{plan.period}</span>
                    </div>
                    <p className="text-sm text-white/40 leading-relaxed font-light">{plan.description}</p>
                  </div>

                  <div className="mb-10 py-3 px-4 bg-white/5 rounded-2xl border border-white/5 inline-self-start">
                    <div className="text-[10px] font-mono text-pink-500 tracking-widest uppercase mb-1">Impact Analytics</div>
                    <div className="text-lg font-bold text-white">{plan.roi} / {plan.roiLabel}</div>
                  </div>

                  <div className="space-y-4 mb-12 flex-grow">
                    <div className="text-[10px] font-mono text-white/20 tracking-widest uppercase mb-6">Core Modules</div>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-4 group/item">
                        <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-pink-500/40 group-hover/item:bg-pink-500 transition-colors" />
                        <span className="text-xs text-white/50 group-hover/item:text-white/80 transition-colors font-light tracking-wide">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Link
                    to="/signup"
                    className={`w-full py-5 rounded-[2rem] font-bold font-mono text-xs tracking-[0.2em] transition-all text-center uppercase ${plan.popular
                      ? 'bg-pink-500 text-white shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:bg-pink-600 hover:shadow-[0_0_40px_rgba(236,72,153,0.5)]'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    {plan.price === "Custom" ? "Contact Terminal" : "Initialize Node ↗"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32">
            {[
              { icon: Zap, title: "INSTANT DEPLOY", desc: "No manual routing. Our neural stack integrates with your communication endpoints in sub-second cycles." },
              { icon: Crown, title: "ELITE SECURITY", desc: "Zero-knowledge encryption for all voice telemetry and CRM synchronization data packets." },
              { icon: Star, title: "24/7 DYNAMICS", desc: "Your neural agents maintain peak human performance without downtime, scaling dynamically with load." }
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="w-16 h-16 bg-white/5 rounded-3xl border border-white/10 flex items-center justify-center mx-auto mb-8 transition-all group-hover:border-pink-500/50 group-hover:bg-pink-500/10 group-hover:scale-110">
                  <item.icon className="w-8 h-8 text-white/20 group-hover:text-pink-500 transition-colors" />
                </div>
                <h4 className="text-sm font-mono font-bold text-white tracking-[0.3em] uppercase mb-4">{item.title}</h4>
                <p className="text-sm text-white/30 leading-relaxed font-light">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-32 relative border-t border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-pink-500/[0.02] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl md:text-7xl font-bold mb-8 tracking-tighter text-white">
            INITIALIZE YOUR <br />
            <span className="text-white/20">NEURAL STACK</span>
          </h2>
          <p className="text-xl text-white/40 mb-12 font-light max-w-2xl mx-auto">
            Join the high-frequency communication revolution. Scale your lead acquisition with zero human friction.
          </p>
          <Link
            to="/signup"
            className="inline-flex items-center gap-4 px-12 py-5 bg-white text-black rounded-full font-bold font-mono text-xs tracking-[0.2em] uppercase hover:bg-pink-500 hover:text-white transition-all shadow-2xl"
          >
            START INITIALIZATION ↗
          </Link>
        </div>
      </div>

      <Footer />
    </div>
  );
}

