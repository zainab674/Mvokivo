
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export const ActionSection = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="py-32 bg-[#050505] overflow-hidden relative border-t border-white/5">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="grid md:grid-cols-2 gap-24 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-6 text-pink-500 font-mono text-[10px] tracking-[0.3em] uppercase">
                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-ping"></div>
                            <span>
                                Neural Deployment
                            </span>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
                            SEE NEURAL <br />
                            <span className="text-white/20 text-[4rem]">VOICE IN ACTION</span>
                        </h2>
                        <p className="text-white/40 text-lg mb-10 leading-relaxed font-light">
                            Deploy neural agents across your entire communication stack. Automate dialers, synchronize calendars, and scale follow-ups with zero human latency.
                        </p>
                        <Button
                            onClick={() => navigate(user ? "/dashboard" : "/signup")}
                            className="bg-white text-black hover:bg-pink-500 hover:text-white rounded-full h-14 px-12 text-sm font-bold font-mono tracking-widest transition-all"
                        >
                            GET STARTED NOW ↗
                        </Button>
                    </div>


                    <div className="relative group">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-pink-500/10 rounded-[3rem] -rotate-6 blur-2xl group-hover:rotate-0 transition-transform duration-700"></div>
                        <div className="relative z-10 p-2 bg-[#0a0b12] rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden">
                            <img
                                src="/dashboard_mockup.png"
                                alt="Dashboard Preview"
                                className="w-full h-auto rounded-[2.5rem] opacity-80"
                            />
                        </div>
                        <motion.div
                            animate={{ y: [0, -10, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute -bottom-10 -right-10 z-20 w-[65%] drop-shadow-[0_20px_50px_rgba(236,72,153,0.3)]"
                        >
                            <img
                                src="/female_holding_phone.png"
                                alt="AI Character"
                                className="w-full h-auto brightness-90 relative"
                            />
                        </motion.div>
                    </div>
                </div>
            </div>
        </div>
    );
};
