
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const tabs = [
    {
        id: 'automation',
        label: 'NEURAL WORKFLOW',
        title: 'Neural Conversation Scaling',
        description:
            'Deploy agents that handle higher-order conversation logic, lead scoring, and automated calendar synchronization with zero human intervention.',
    },
    {
        id: 'filtering',
        label: 'COMPLIANCE ENGINE',
        title: 'High-Frequency Filtering',
        description:
            'Autonomous TCPA and DNC filtering across all dialer sessions, ensuring every outbound campaign remains within legal safety parameters.',
    },

    {
        id: 'analytics',
        label: 'SPEECH INTELLIGENCE',
        title: 'Sub-second Sentiment Analysis',
        description:
            'Processing raw audio in real-time to detect sentiment, urgency, and specific conversion signals through our custom neural engine.',
    },
    {
        id: 'reporting',
        label: 'SYSTEM TELEMETRY',
        title: 'Real-time Dashboards',
        description:
            'Visualizing system-wide performance, campaign KPIs, and session success rates via high-fidelity, low-latency reporting modules.',
    },
    {
        id: 'sms',
        label: 'MULTI-CHANNEL OPS',
        title: 'Automated Sync Follow-ups',
        description:
            'Triggering synchronized emails and messages instantly after voice sessions, maintaining a persistent lead engagement loop.',
    },
];


export const TabbedFeatures = () => {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <div className="py-32 bg-[#050505] relative border-t border-white/5">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex flex-col lg:flex-row gap-0 bg-[#0a0b12] rounded-[3rem] shadow-2xl overflow-hidden border border-white/5">
                    {/* Sidebar Tabs */}
                    <div className="lg:w-2/5 flex flex-col bg-white/[0.02] border-r border-white/5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center justify-between px-10 py-8 transition-all text-left group relative border-b border-white/5 last:border-b-0 ${activeTab.id === tab.id
                                    ? 'bg-pink-500/10'
                                    : 'hover:bg-white/[0.05]'
                                    }`}
                            >
                                {activeTab.id === tab.id && (
                                    <motion.div layoutId="activeTab" className="absolute left-0 top-0 bottom-0 w-1 bg-pink-500" />
                                )}
                                <span className={`font-mono text-xs tracking-[0.2em] uppercase transition-colors ${activeTab.id === tab.id ? 'text-pink-500' : 'text-white/30 group-hover:text-white/60'}`}>
                                    {tab.label}
                                </span>
                                <div className={`w-2 h-2 rounded-full transition-all ${activeTab.id === tab.id ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'bg-white/10 group-hover:bg-white/30'}`}></div>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:w-3/5 p-16 relative flex items-center bg-gradient-to-br from-pink-500/[0.02] to-transparent">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.4 }}
                                className="w-full"
                            >
                                <div className="max-w-2xl">
                                    <div className="text-pink-500 font-mono text-[10px] tracking-[0.4em] uppercase mb-6">Module: {activeTab.id}</div>
                                    <h3 className="text-4xl md:text-5xl font-bold text-white mb-8 tracking-tighter leading-tight">{activeTab.title}</h3>
                                    <p className="text-xl text-white/40 mb-12 leading-relaxed font-light">
                                        {activeTab.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-6 mb-12">
                                        {['High scalability', 'Low-latency sync', 'Encryption-at-rest', 'Global redundancy'].map((item) => (
                                            <div key={item} className="flex items-center gap-3">
                                                <CheckCircle2 className="w-5 h-5 text-pink-500" />
                                                <span className="text-white/60 font-mono text-[10px] tracking-widest uppercase">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="relative mt-8 group">
                                        <div className="absolute inset-0 bg-pink-500/10 rounded-3xl blur-2xl opacity-50"></div>
                                        <div className="relative bg-white/5 p-8 rounded-3xl border border-white/5 flex items-center gap-8 backdrop-blur-xl">
                                            <div className="w-12 h-12 bg-pink-500/20 rounded-2xl flex items-center justify-center border border-pink-500/30">
                                                <div className="w-3 h-3 bg-pink-500 rounded-full animate-pulse shadow-[0_0_10px_#ec4899]"></div>
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-white mb-1 tracking-tight">System Status: Active</h4>
                                                <p className="text-sm text-white/30">Node synchronized with {activeTab.label} cluster.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
