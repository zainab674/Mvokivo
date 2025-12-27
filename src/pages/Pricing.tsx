
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
      name: PLAN_CONFIGS.free.name,
      price: "$0",
      period: "/month",
      description: PLAN_CONFIGS.free.description,
      features: PLAN_CONFIGS.free.features,
      target: PLAN_CONFIGS.free.target,
      popular: false,
      color: "from-slate-500/10",
      icon: "⚪"
    },
    {
      name: PLAN_CONFIGS.starter.name,
      price: "$29",
      period: "/month",
      description: PLAN_CONFIGS.starter.description,
      features: PLAN_CONFIGS.starter.features,
      target: PLAN_CONFIGS.starter.target,
      popular: false,
      color: "from-green-500/10",
      icon: "🟢"
    },
    {
      name: PLAN_CONFIGS.growth.name,
      price: "$79",
      period: "/month",
      description: PLAN_CONFIGS.growth.description,
      features: PLAN_CONFIGS.growth.features,
      target: PLAN_CONFIGS.growth.target,
      popular: true,
      color: "from-blue-500/20",
      icon: "🔵"
    },
    {
      name: PLAN_CONFIGS.pro.name,
      price: "$149",
      period: "/month",
      description: PLAN_CONFIGS.pro.description,
      features: PLAN_CONFIGS.pro.features,
      target: PLAN_CONFIGS.pro.target,
      popular: false,
      color: "from-purple-500/20",
      icon: "🟣"
    },
    {
      name: PLAN_CONFIGS.enterprise.name,
      price: "Custom",
      period: "",
      description: PLAN_CONFIGS.enterprise.description,
      features: PLAN_CONFIGS.enterprise.features,
      target: PLAN_CONFIGS.enterprise.target,
      popular: false,
      color: "from-red-500/20",
      icon: "🔴"
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
        <div className="max-w-7xl mx-auto">
          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-6 mb-20 items-stretch">
            {plans.map((plan, index) => (
              <div
                key={index}
                className={`group relative bg-[#0a0b12] rounded-[2.5rem] border transition-all duration-500 overflow-hidden flex flex-col ${plan.popular ? 'border-pink-500/50 shadow-[0_0_50px_rgba(236,72,153,0.15)] z-20 scale-105' : 'border-white/5 hover:border-white/10 shadow-2xl'}`}
              >
                <div className={`absolute inset-0 bg-gradient-to-b ${plan.color} to-transparent opacity-30 group-hover:opacity-50 transition-opacity`}></div>

                <div className="p-8 relative z-10 flex-grow flex flex-col">
                  {plan.popular && (
                    <div className="absolute top-4 right-6">
                      <div className="px-2 py-0.5 bg-pink-500 text-white text-[8px] font-mono font-bold uppercase tracking-widest rounded-full shadow-[0_0_15px_rgba(236,72,153,0.5)]">
                        POPULAR
                      </div>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="text-2xl mb-2">{plan.icon}</div>
                    <h3 className="text-xs font-mono text-white/30 tracking-[0.2em] uppercase mb-3">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-2">
                      <span className="text-3xl font-bold tracking-tighter text-white">{plan.price}</span>
                      <span className="text-[10px] font-mono text-white/20 tracking-widest uppercase">{plan.period}</span>
                    </div>
                    <p className="text-[10px] text-white/40 leading-relaxed font-light line-clamp-2 h-8">{plan.description}</p>
                  </div>

                  <div className="space-y-3 mb-8 flex-grow">
                    <div className="text-[9px] font-mono text-white/20 tracking-widest uppercase mb-4">Features</div>
                    {plan.features.map((feature, featureIndex) => (
                      <div key={featureIndex} className="flex items-start gap-3 group/item">
                        <div className="mt-1 w-1 h-1 rounded-full bg-pink-500/40 group-hover/item:bg-pink-500 transition-colors shrink-0" />
                        <span className="text-[10px] text-white/50 group-hover/item:text-white/80 transition-colors font-light tracking-wide leading-tight">{feature}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mb-8 pt-4 border-t border-white/5">
                    <div className="text-[8px] font-mono text-pink-500 tracking-widest uppercase mb-1">Target</div>
                    <div className="text-xs font-bold text-white/70">🎯 {plan.target}</div>
                  </div>

                  <Link
                    to="/signup"
                    className={`w-full py-4 rounded-2xl font-bold font-mono text-[10px] tracking-[0.2em] transition-all text-center uppercase ${plan.popular
                      ? 'bg-pink-500 text-white shadow-[0_0_30px_rgba(236,72,153,0.3)] hover:bg-pink-600'
                      : 'bg-white/5 text-white border border-white/10 hover:bg-white/10 hover:border-white/20'
                      }`}
                  >
                    {plan.price === "Custom" ? "Contact Sales" : "Get Started ↗"}
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Smart Website Copy */}
          <div className="text-center mb-32 max-w-3xl mx-auto px-6 bg-white/5 border border-white/5 py-8 rounded-3xl backdrop-blur-sm">
            <p className="text-white/60 text-sm md:text-base font-light leading-relaxed">
              “Voice usage is billed per minute. Premium voices are available from the <span className="text-blue-400 font-medium">Growth plan</span> onwards. Enterprise plans offer custom pricing and full white-label support.”
            </p>
          </div>

          {/* Value Props */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-32 lg:px-24">
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
      <div className="py-32 relative border-t border-white/5 overflow-hidden text-center">
        <div className="absolute inset-0 bg-pink-500/[0.02] pointer-events-none"></div>
        <div className="max-w-4xl mx-auto px-6 relative z-10">
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
