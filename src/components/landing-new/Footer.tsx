
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
        <footer className="pt-24 pb-12 bg-purple-700 text-white overflow-hidden relative">
            <div className="absolute bottom-0 right-0 w-[40%] h-[60%] opacity-10 pointer-events-none">
                <div className="w-full h-full bg-[radial-gradient(circle_at_bottom_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
            </div>

            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 mb-20">
                    <div className="col-span-2 lg:col-span-1">
                        <div className="flex items-center gap-2 mb-6">
                            <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center">
                                <div className="w-5 h-5 border-2 border-purple-600 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-purple-600 rounded-full"></div>
                                </div>
                            </div>
                            <span className="text-white font-bold text-xl tracking-tight uppercase">
                                VOKIVO
                            </span>
                        </div>

                        <div className="flex gap-4 mb-8">
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                                <Facebook className="w-5 h-5 text-white" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                                <Twitter className="w-5 h-5 text-white" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                                <Instagram className="w-5 h-5 text-white" />
                            </div>
                            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-all cursor-pointer">
                                <Linkedin className="w-5 h-5 text-white" />
                            </div>
                        </div>
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-2 text-sm text-purple-100 italic">
                                <Mail className="w-4 h-4" />
                                Email: Vokivomain@gmail.com
                            </div>
                        </div>
                    </div>

                    {columns.map((column, idx) => (
                        <div key={idx} className="flex flex-col gap-4">
                            <h4 className="font-bold text-lg mb-2">{column.title}</h4>
                            <ul className="flex flex-col gap-2">
                                {column.items.map((item, i) => (
                                    <li key={i}>
                                        <Link to={item.to} className="text-purple-100 text-sm hover:text-white transition-colors">
                                            {item.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6 text-sm text-purple-200">
                    <p>© 2025 VOKIVO. All Rights Reserved.</p>

                    <div className="flex gap-8">
                        <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Cookie Policy</Link>
                        <Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
};
