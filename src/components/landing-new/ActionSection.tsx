
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useNavigate } from "react-router-dom";

export const ActionSection = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="py-24 bg-white overflow-hidden">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="grid md:grid-cols-2 gap-16 items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-purple-600">
                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-ping"></div>
                            <span className="font-semibold text-sm uppercase tracking-wider">
                                VOKIVO in Action
                            </span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                            See VOKIVO’s AI voice <br /> assistants <span className="text-purple-600">in action</span>
                        </h2>
                        <p className="text-gray-600 text-lg mb-10 leading-relaxed">
                            With VOKIVO’s AI voice agents connected to your phone numbers, calendars, and email,
                            your business can automatically call leads, qualify them, book appointments,
                            and manage follow-ups — all without manual effort. Book a demo to see how VOKIVO
                            turns conversations into real customers.
                        </p>
                        <Button
                            onClick={() => navigate(user ? "/dashboard" : "/signup")}
                            className="bg-gray-900 text-white hover:bg-black rounded-full h-14 px-10 text-lg font-bold"
                        >
                            Book A Demo ↗
                        </Button>
                    </div>


                    <div className="relative">
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[80%] bg-purple-100 rounded-3xl -rotate-6"></div>
                        <img
                            src="/dashboard_mockup.png"
                            alt="Dashboard Preview"
                            className="relative z-10 w-full h-auto rounded-2xl shadow-2xl border border-gray-100"
                        />
                        <img
                            src="/female_holding_phone.png"
                            alt="AI Character"
                            className="absolute bottom-[-10%] right-[-10%] z-20 w-[60%] h-auto drop-shadow-2xl"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
