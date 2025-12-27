
import React from 'react';
import {
    PhoneCall, Users, BarChart3, Target,
    Activity, ListFilter, MessageSquare,
    Eye, ShieldAlert, Wifi, FileText, Share2
} from "lucide-react";

const featureItems = [
    { icon: PhoneCall, label: 'Smart Caller ID' },
    { icon: Users, label: 'AI Lead Qualification' },
    { icon: BarChart3, label: 'Conversation Intelligence' },
    { icon: Target, label: 'Lead Routing & Assignment' },
    { icon: ListFilter, label: 'Intelligent Call Queues' },
    { icon: MessageSquare, label: 'Automated Messages & Emails' },
    { icon: Eye, label: 'Live Call Monitoring' },
    { icon: FileText, label: 'Custom Reports & Logs' },
    { icon: Share2, label: ' Tool Integrations' },
];


export const FeaturesGrid = () => {
    return (
        <div id="features" className="py-24 bg-[#050505] relative border-t border-white/5">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="text-center mb-28">
                    <div className="inline-block px-4 py-1.5 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-6 border border-pink-500/20">
                        Platform Features
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
                        PRO-GRADE <br />
                        <span className="text-white/20">AI TOOLKIT</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featureItems.map((item, index) => (
                        <div
                            key={index}
                            className="group bg-[#0a0b12] p-8 rounded-[2rem] border border-white/5 hover:border-pink-500/30 transition-all cursor-default flex items-center gap-6 shadow-2xl"
                        >
                            <div className="w-14 h-14 rounded-2xl bg-pink-500/10 flex items-center justify-center text-pink-500 group-hover:bg-pink-500 group-hover:text-white transition-all shadow-[0_0_20px_rgba(236,72,153,0.1)] group-hover:shadow-[0_0_30px_rgba(236,72,153,0.3)]">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-white/70 text-lg group-hover:text-white transition-all tracking-tight uppercase font-mono text-sm leading-tight">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
