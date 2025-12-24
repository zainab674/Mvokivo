
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useNavigate, Link } from "react-router-dom";

export const Navbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 lg:px-24 bg-black/5 backdrop-blur-xl border-b border-white/5">
            <Link to="/" className="flex items-center gap-2 group">
                <div className="w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center bg-white/5 transition-all group-hover:border-pink-500/50 group-hover:bg-pink-500/10">
                    <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center transition-transform group-hover:scale-110">
                        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                    </div>
                </div>
                <span className="text-white font-bold text-2xl tracking-tighter transition-colors group-hover:text-pink-500">VOKIVO</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-white/50 font-mono text-[10px] uppercase tracking-[0.2em]">
                <Link to="#features" className="hover:text-white transition-colors">Features</Link>
                <Link to="#pricing" className="hover:text-white transition-colors">Pricing</Link>
                <Link to="#docs" className="hover:text-white transition-colors">Docs</Link>
            </div>

            <Button
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                className="bg-white text-black hover:bg-pink-500 hover:text-white rounded-full px-8 h-11 font-bold font-mono text-xs tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
                {user ? "DASHBOARD" : "LOGIN"}
            </Button>
        </nav>
    );
};

