
import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Star } from "lucide-react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useNavigate } from "react-router-dom";

export const Hero = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-[#5b21b6]">
            {/* Background patterns */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-400/30 rounded-full blur-3xl"></div>
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>

                {/* Dot pattern */}
                <div className="absolute top-20 left-10 grid grid-cols-6 gap-2">
                    {[...Array(36)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-white/40 rounded-full"></div>
                    ))}
                </div>
            </div>

            <div className="container mx-auto px-6 md:px-12 lg:px-24 grid md:grid-cols-2 items-center relative z-10">
                <div className="max-w-2xl text-white">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
                        <Star className="w-4 h-4 fill-white text-white" />
                        <span className="text-xs font-semibold uppercase tracking-wider">Presenting AI Voice Assistants</span>
                    </div>

                    <h1 className="text-xl md:text-3xl lg:text-5xl font-bold mb-6 leading-[1.1]">
                        AI Voice Agents for <br />
                        <span className="text-white/90 text-md">Calls, Bookings & Lead Conversion</span>
                    </h1>


                    <p className="text-lg md:text-xl text-white/80 mb-10 max-w-lg leading-relaxed">
                        Build smart AI voice assistants that call leads, talk like humans, book appointments,
                        collect customer data, and automate follow-ups using calls and email — all in one platform.
                    </p>


                    <Button
                        onClick={() => navigate(user ? "/dashboard" : "/signup")}
                        className="bg-white text-purple-700 hover:bg-white/90 rounded-full h-14 px-8 text-lg font-bold flex items-center gap-2 group transition-all"
                    >
                        Launch Your AI Agent <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>


                <div className="hidden md:block relative h-full">
                    <img
                        src="/hero_male_agent.png"
                        alt="AI Voice Assistant"
                        className="w-full h-auto object-contain transform scale-110 translate-y-12"
                    />
                </div>
            </div>
        </section>
    );
};
