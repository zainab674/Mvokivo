import React from 'react';
import { MousePointer2, Zap, BarChart3, Globe } from "lucide-react";
import { motion } from "framer-motion";

export const DetailedFeatures = () => {
    return (
        <div id="features" className="py-32 bg-[#050505] relative border-t border-white/5">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                {/* Header */}
                <div className="text-center max-w-4xl mx-auto mb-28">
                    <div className="inline-block px-4 py-1.5 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-6 border border-pink-500/20">
                        Capabilities
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
                        INTELLIGENT AI <br />
                        <span className="text-white/20">VOICE PLATFORM</span>
                    </h2>
                    <p className="text-white/40 text-lg font-mono tracking-wide max-w-2xl mx-auto uppercase text-xs leading-relaxed">
                        Replacing traditional business calling with neural voice agents that process, book, and qualify leads with human-like precision.
                    </p>
                </div>

                {/* Section 1 */}
                <div className="grid md:grid-cols-2 gap-24 items-center mb-40">
                    <div>
                        <div className="flex items-center gap-3 mb-6 text-pink-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                            <MousePointer2 className="w-4 h-4" />
                            <span>Neural Auto Dialer</span>
                        </div>

                        <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tighter leading-[1.1]">
                            AI voice agents that <br />
                            <span className="text-white/30 text-3xl">call leads for you</span>
                        </h3>
                        <p className="text-white/40 text-lg mb-10 leading-relaxed font-light">
                            VOKIVO’s high-frequency dialer orchestrates thousands of outbound sessions simultaneously, qualifiers intent, and synchronizes hot opportunities directly to your CRM.
                        </p>

                        <div className="flex flex-col gap-4">
                            {['Zero-latency response', 'Human-like cadence', 'Real-time CRM sync'].map((item) => (
                                <div key={item} className="flex items-center gap-3">
                                    <div className="w-1.5 h-1.5 bg-pink-500 rounded-full" />
                                    <span className="text-white/60 font-mono text-[10px] tracking-widest uppercase">{item}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-pink-500/10 rounded-[3rem] blur-3xl transition-opacity group-hover:bg-pink-500/20"></div>
                        <div className="relative bg-[#0a0b12] p-2 rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden shadow-pink-500/5">
                            <img
                                src="/dashboard_mockup.png"
                                alt="Dashboard"
                                className="rounded-[2.5rem] border border-white/5 opacity-80"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div className="grid md:grid-cols-2 gap-24 items-center mb-40">
                    <div className="order-2 md:order-1 relative group">
                        <div className="absolute inset-0 bg-purple-500/10 rounded-full blur-3xl transform scale-75 group-hover:scale-95 transition-transform"></div>
                        <div className="relative bg-[#0a0b12] p-8 rounded-[3rem] border border-white/5 shadow-2xl backdrop-blur-3xl">
                            <div className="flex flex-col gap-6">
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="font-mono text-[10px] text-white/50 tracking-[0.2em] uppercase">Smart Channels</span>
                                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse shadow-[0_0_10px_#ec4899]"></div>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl border border-white/5">
                                    <span className="font-mono text-[10px] text-white/50 tracking-[0.2em] uppercase">24/7 Processing</span>
                                    <div className="w-2 h-2 bg-white/20 rounded-full"></div>
                                </div>
                                <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-500/20 to-transparent border border-pink-500/20">
                                    <div className="text-[10px] font-mono text-pink-500 mb-2 tracking-widest uppercase">System Load</div>
                                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            animate={{ width: ['20%', '90%', '20%'] }}
                                            transition={{ duration: 3, repeat: Infinity }}
                                            className="h-full bg-pink-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="flex items-center gap-3 mb-6 text-pink-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                            <Zap className="w-4 h-4" />
                            <span>Intelligent Routing</span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tighter leading-[1.1]">
                            Dynamic lead <br />
                            <span className="text-white/30 text-[3.5rem]">qualification</span>
                        </h3>
                        <p className="text-white/40 text-lg mb-10 leading-relaxed font-light">
                            Sophisticated neural processing scores every interaction, capturing sentiment and intent to route prospects to high-value conversions instantly.
                        </p>
                    </div>
                </div>

                {/* Section 3 */}
                <div className="grid md:grid-cols-2 gap-24 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-6 text-pink-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                            <BarChart3 className="w-4 h-4" />
                            <span>Real-time Analytics</span>
                        </div>
                        <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tighter leading-[1.1]">
                            Neural call logs & <br />
                            <span className="text-white/30 text-3xl">conversation insights</span>
                        </h3>
                        <p className="text-white/40 text-lg mb-10 leading-relaxed font-light">
                            Every interaction is recorded, transcribed, and analyzed by our neural engine. Detect sentiment, extract keywords, and optimize performance in real time.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-[#0a0b12] p-8 rounded-[2.5rem] border border-white/5 flex items-center justify-center relative overflow-hidden group">
                            <div className="absolute inset-0 bg-pink-500/5 group-hover:bg-pink-500/10 transition-colors" />
                            <div className="w-24 h-24 border-4 border-pink-500/20 border-t-pink-500 rounded-full animate-spin relative z-10"></div>
                        </div>
                        <div className="bg-[#0a0b12] p-6 rounded-[2.5rem] border border-white/5 flex flex-col justify-center gap-4 relative overflow-hidden">
                            {[
                                { icon: '🎧', label: 'Listen In' },
                                { icon: '💬', label: 'Whisper Mode' }
                            ].map((item) => (
                                <div key={item.label} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5 hover:bg-white/10 transition-colors group cursor-pointer">
                                    <div className="w-10 h-10 bg-pink-500/10 rounded-lg flex items-center justify-center text-lg">{item.icon}</div>
                                    <span className="text-[10px] font-mono text-white/50 tracking-widest uppercase group-hover:text-pink-500 transition-colors">{item.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="col-span-2 bg-gradient-to-br from-pink-600/20 to-transparent p-8 rounded-[2.5rem] border border-pink-500/20 relative overflow-hidden backdrop-blur-3xl">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="flex -space-x-4">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-10 h-10 rounded-full border-2 border-[#12141d] bg-zinc-800" />
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-mono text-pink-500 tracking-[0.2em] uppercase">Agents on call</span>
                                </div>
                                <div className="text-[10px] font-mono text-white/30 tracking-widest uppercase">Live Pulse</div>
                            </div>
                            <div className="h-16 flex items-end justify-center gap-1.5 px-2">
                                {[...Array(24)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ height: [`${20 + Math.random() * 80}%`, `${20 + Math.random() * 80}%`] }}
                                        transition={{ duration: 1.5, repeat: Infinity, repeatType: "mirror", delay: i * 0.05 }}
                                        className="w-1 bg-pink-500/40 rounded-full"
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
