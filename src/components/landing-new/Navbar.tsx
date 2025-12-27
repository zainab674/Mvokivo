
import React from 'react';
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useNavigate, Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

export const Navbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-3 md:px-12 lg:px-24 bg-black/5 backdrop-blur-xl border-b border-white/5">
            <Link to="/" className="flex items-center gap-2 group">
                <Logo />
                <span className="text-white font-bold text-2xl tracking-tighter transition-colors group-hover:text-pink-500">VOKIVO</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-white/50 font-mono text-[10px] uppercase tracking-[0.2em]">
                <Link to="/pricing" className="hover:text-white transition-colors">Pricing</Link>
            </div>


            <Button
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                className="bg-white text-black hover:bg-pink-500 hover:text-white rounded-full px-8 h-11 font-bold font-mono text-base tracking-widest transition-all shadow-[0_0_20px_rgba(255,255,255,0.05)]"
            >
                {user ? "DASHBOARD" : "LOGIN"}
            </Button>
        </nav>
    );
};

