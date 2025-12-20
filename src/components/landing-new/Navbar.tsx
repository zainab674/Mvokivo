
import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ArrowRight } from "lucide-react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useNavigate, Link } from "react-router-dom";

export const Navbar = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    return (
        <nav className="absolute top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-6 md:px-12 lg:px-24">
            <Link to="/" className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-purple-600 rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                    </div>
                </div>
                <span className="text-white font-bold text-xl tracking-tight">VOKIVO</span>
            </Link>

            <div className="hidden md:flex items-center gap-8 text-white/90 font-medium text-sm">

            </div>

            <Button
                onClick={() => navigate(user ? "/dashboard" : "/login")}
                className="bg-white text-purple-700 hover:bg-white/90 rounded-full px-6 flex items-center gap-2"
            >
                {user ? "Dashboard" : "Login"} <ArrowRight className="w-4 h-4" />
            </Button>
        </nav>
    );
};

