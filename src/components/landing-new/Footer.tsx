
import React from 'react';
import { Facebook, Twitter, Instagram, Linkedin, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";

export const Footer = () => {
    const columns = [
        {
            title: "Product",
            items: [
                { name: "Features", to: "/#features" },
                { name: "Pricing", to: "/pricing" },
            ]
        },
        {
            title: "Company",
            items: [
                { name: "About Us", to: "/#about" },
                { name: "FAQ", to: "/#faq" },
            ]
        },

        {
            title: "Legal",
            items: [
                { name: "Privacy Policy", to: "/privacy" },
                { name: "Terms & Conditions", to: "/terms" },
                { name: "Cookie Policy", to: "/privacy" },
            ]
        }
    ];

    return (
        <footer className="pt-32 pb-12 bg-[#050505] text-white overflow-hidden relative border-t border-white/5">
            <div className="absolute top-0 right-0 w-[40%] h-[60%] opacity-20 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent"></div>
            </div>

            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-12 mb-28">
                    <div className="col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 border border-white/20 rounded-xl flex items-center justify-center bg-white/5">
                                <div className="w-5 h-5 border-2 border-white rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                            <span className="text-white font-bold text-2xl tracking-tighter uppercase">
                                VOKIVO
                            </span>
                        </div>

                        <div className="flex gap-4 mb-10">
                            {[Facebook, Twitter, Instagram, Linkedin].map((Icon, i) => (
                                <div key={i} className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-pink-500/10 hover:border-pink-500/50 transition-all cursor-pointer group">
                                    <Icon className="w-5 h-5 text-white/40 group-hover:text-pink-500 transition-colors" />
                                </div>
                            ))}
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 text-xs font-mono tracking-widest text-white/30 uppercase">
                                <Mail className="w-4 h-4 text-pink-500" />
                                Vokivomain@gmail.com
                            </div>
                        </div>
                    </div>

                    {columns.map((column, idx) => (
                        <div key={idx} className="flex flex-col gap-6">
                            <h4 className="font-mono text-[10px] uppercase tracking-[0.3em] text-white/20">{column.title}</h4>
                            <ul className="flex flex-col gap-4">
                                {column.items.map((item, i) => (
                                    <li key={i}>
                                        <Link to={item.to} className="text-white/40 text-sm hover:text-pink-500 transition-colors font-light">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8 text-[10px] font-mono tracking-widest text-white/20 uppercase">
                    <p>© 2025 VOKIVO. NEURAL SYSTEMS ARCHITECTURE.</p>

                    <div className="flex gap-10">
                        <Link to="/terms" className="hover:text-white transition-colors">Terms</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
