
import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
    BarChart3,
    Bot,
    MessageSquare,
    Users,
    Megaphone,
    Phone,
    Shield,
    Settings,
    ChevronLeft,
    ChevronRight,
    LogOut,
    Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useWebsiteSettings } from "@/contexts/WebsiteSettingsContext";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();
    const [collapsed, setCollapsed] = useState(false);
    const { user, signOut } = useAuth();
    const { websiteSettings } = useWebsiteSettings();

    const isAdmin = user?.role === 'admin';

    const navItems = [
        { icon: <BarChart3 size={20} />, label: "Dashboard", to: "/dashboard" },
        { icon: <Bot size={20} />, label: "Assistants", to: "/assistants" },
        { icon: <MessageSquare size={20} />, label: "Conversations", to: "/conversations" },
        { icon: <Users size={20} />, label: "Contacts", to: "/contacts" },
        { icon: <Megaphone size={20} />, label: "Campaigns", to: "/campaigns" },

    ];

    if (isAdmin) {
        navItems.push({ icon: <Shield size={20} />, label: "Admin", to: "/admin" });
    }

    return (
        <aside
            className={cn(
                "relative h-screen flex flex-col border-r border-border bg-background/80 backdrop-blur-xl transition-all duration-300 z-50",
                collapsed ? "w-20" : "w-64"
            )}
        >
            {/* Logo/Brand Area */}
            <div className="h-16 flex items-center justify-center border-b border-border p-4">
                {collapsed ? (
                    <div className="h-10 w-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <span className="text-white font-bold text-xl"></span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        {websiteSettings?.logo ? (
                            <img src={websiteSettings?.logo} alt={websiteSettings?.website_name} className="w-8 h-8 object-contain" />
                        ) :
                            <div className="h-8 w-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                                <Sparkles className="h-4 w-4 text-white" />
                            </div>
                        }
                        <span className="font-bold text-lg text-foreground tracking-tight">
                            {websiteSettings?.website_name || "Vokivo"}
                        </span>
                    </div>
                )}
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 custom-scrollbar">
                <TooltipProvider delayDuration={0}>
                    {navItems.map((item) => {
                        const isActive = location.pathname === item.to;
                        return (
                            <div key={item.to} className="w-full">
                                {collapsed ? (
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <Link
                                                to={item.to}
                                                className={cn(
                                                    "flex items-center justify-center w-full h-12 rounded-xl transition-all duration-200 group relative",
                                                    isActive
                                                        ? "bg-gradient-to-br from-indigo-500/20 to-purple-600/20 text-indigo-400"
                                                        : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                                )}
                                            >
                                                {isActive && (
                                                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 bg-indigo-500 rounded-r-full" />
                                                )}
                                                {item.icon}
                                            </Link>
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-medium bg-zinc-900 border-zinc-800 text-zinc-100">
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : (
                                    <Link
                                        to={item.to}
                                        className={cn(
                                            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden",
                                            isActive
                                                ? "bg-gradient-to-r from-indigo-500/10 to-purple-500/10 text-indigo-400 font-medium border border-indigo-500/10"
                                                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                                        )}
                                    >
                                        {isActive && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500 to-purple-600" />
                                        )}
                                        <span className={cn("transition-colors", isActive ? "text-indigo-400" : "group-hover:text-foreground")}>
                                            {item.icon}
                                        </span>
                                        <span>{item.label}</span>
                                    </Link>
                                )}
                            </div>
                        );
                    })}
                </TooltipProvider>
            </div>

            {/* Bottom Actions */}
            <div className="p-3 border-t border-border space-y-2">
                <TooltipProvider delayDuration={0}>
                    {/* Settings Link */}
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Link
                                    to="/settings"
                                    className="flex items-center justify-center w-full h-12 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                                >
                                    <Settings size={20} />
                                </Link>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-popover border-border text-popover-foreground">Settings</TooltipContent>
                        </Tooltip>
                    ) : (
                        <Link
                            to="/settings"
                            className="flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-all"
                        >
                            <Settings size={20} />
                            <span>Settings</span>
                        </Link>
                    )}

                    {/* Sign Out */}
                    {collapsed ? (
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <button
                                    onClick={() => signOut()}
                                    className="flex items-center justify-center w-full h-12 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all"
                                >
                                    <LogOut size={20} />
                                </button>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="bg-popover border-border text-popover-foreground">Sign Out</TooltipContent>
                        </Tooltip>
                    ) : (
                        <button
                            onClick={() => signOut()}
                            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all text-left"
                        >
                            <LogOut size={20} />
                            <span>Sign Out</span>
                        </button>
                    )}
                </TooltipProvider>
            </div>

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 bg-zinc-900 border border-zinc-800 text-zinc-400 p-1 rounded-full shadow-xl hover:text-white hover:border-zinc-700 transition-all z-50"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </aside>
    );
}
