
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
    Sparkles,
    Mail,
    Rocket,
    ChevronDown,
    LayoutDashboard,
    Zap,
    ExternalLink,
    Server,
    Key,
    UserCircle,
    Info,
    CreditCard,
    Workflow
} from "lucide-react";


import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useWebsiteSettings } from "@/contexts/WebsiteSettingsContext";
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from "@/components/Logo";


interface SidebarContentProps {
    collapsed: boolean;
    user: any;
    signOut: () => void;
    websiteSettings: any;
    location: any;
    isAdmin: boolean;
    onClose?: () => void;
}

export function SidebarContent({
    collapsed,
    user,
    signOut,
    websiteSettings,
    location,
    isAdmin,
    onClose
}: SidebarContentProps) {
    const navItems = [
        { icon: <LayoutDashboard size={18} />, label: "Dashboard", to: "/dashboard" },
        { icon: <Bot size={18} />, label: "Agents", to: "/assistants" },
        { icon: <MessageSquare size={18} />, label: "Chats", to: "/conversations" },

        { icon: <Users size={18} />, label: "Contacts", to: "/contacts" },
    ];

    const campaignItems = [
        { icon: <Rocket size={18} />, label: "Call Campaigns", to: "/campaigns" },
        { icon: <Megaphone size={18} />, label: "Email Campaigns", to: "/email-campaigns" },
    ];

    const managementItems = [
        { icon: <Mail size={18} />, label: "Emails", to: "/emails" },
        { icon: <CreditCard size={18} />, label: "Billing", to: "/billing" },
        { icon: <Settings size={18} />, label: "Settings", to: "/settings" },
    ];

    if (isAdmin) {
        managementItems.push({ icon: <Shield size={18} />, label: "Admin Panel", to: "/admin" });
    }

    const bottomItems = [
        { icon: <UserCircle size={18} />, label: "Profile", to: "/profile" },
    ];

    return (
        <div className="flex flex-col h-full">
            {/* Logo/Brand Area */}
            <div className="p-4 border-b border-[#1e1e20]">
                <Link to="/" onClick={onClose} className="block">
                    {collapsed ? (
                        <div className="flex items-center justify-center py-2 hover:bg-zinc-800/50 rounded-xl transition-colors">
                            <Logo size="md" />
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-2 rounded-xl hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-3">
                                <Logo size="sm" />
                                <div className="flex flex-col">
                                    <h1 className="text-[20px] text-zinc-200 font-medium tracking-tight">
                                        {websiteSettings?.website_name || "Vokivo"}
                                    </h1>
                                </div>
                            </div>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6 custom-scrollbar">
                <div className="space-y-6">
                    <div className="space-y-1">
                        <TooltipProvider delayDuration={0}>
                            {navItems.map((item) => {
                                const isActive = location.pathname === item.to;
                                return (
                                    <Link
                                        key={item.label}
                                        to={item.to}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            {item.icon}
                                            {!collapsed && <span className="text-sm font-medium">{item.label}</span>}
                                        </div>
                                    </Link>
                                );
                            })}
                        </TooltipProvider>
                    </div>

                    {!collapsed && (
                        <>
                            <div className="space-y-1">
                                <span className="px-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Campaigns</span>
                                {campaignItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.to}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                                            location.pathname === item.to ? "text-white bg-zinc-800/50" : "text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300"
                                        )}
                                    >
                                        {item.icon}
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                ))}
                            </div>

                            <div className="space-y-1">
                                <span className="px-3 text-[10px] font-semibold text-zinc-600 uppercase tracking-widest">Management</span>
                                {managementItems.map((item) => (
                                    <Link
                                        key={item.label}
                                        to={item.to}
                                        onClick={onClose}
                                        className={cn(
                                            "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                                            location.pathname === item.to ? "text-white bg-zinc-800/50" : "text-zinc-500 hover:bg-zinc-800/30 hover:text-zinc-300"
                                        )}
                                    >
                                        {item.icon}
                                        <span className="text-sm font-medium">{item.label}</span>
                                    </Link>
                                ))}
                            </div>
                        </>
                    )}
                </div>

                {!collapsed && (
                    <div className="pt-4 border-t border-[#1e1e20] space-y-1">
                        {bottomItems.map((item) => (
                            <Link
                                key={item.label}
                                to={item.to}
                                onClick={onClose}
                                className="flex items-center gap-3 px-3 py-2 rounded-lg text-zinc-500 hover:bg-zinc-800/50 hover:text-zinc-300 transition-all"
                            >
                                {item.icon}
                                <span className="text-sm font-medium">{item.label}</span>
                            </Link>
                        ))}
                    </div>
                )}
            </div>

            {/* User Profile at Bottom */}
            <div className="p-4 border-t border-[#1e1e20]">
                {collapsed ? (
                    <Avatar className="h-9 w-9 border border-zinc-800 mx-auto">
                        <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                            {user?.fullName?.charAt(0) || 'U'}
                        </AvatarFallback>
                    </Avatar>
                ) : (
                    <div className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-9 w-9 border border-zinc-800">
                                <AvatarFallback className="bg-zinc-800 text-zinc-400 text-xs">
                                    {user?.fullName?.charAt(0) || 'U'}
                                </AvatarFallback>
                            </Avatar>
                            <div className="flex flex-col">
                                <span className="text-xs font-semibold text-zinc-200 truncate max-w-[120px]">
                                    {user?.fullName || "User Name"}
                                </span>
                                <span className="text-[10px] text-zinc-500 truncate max-w-[120px]">
                                    {user?.email || "user@email.com"}
                                </span>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                signOut();
                                if (onClose) onClose();
                            }}
                            className="text-zinc-500 hover:text-zinc-300 transition-colors"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function Sidebar() {
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(false);
    const { user, signOut } = useAuth();
    const { websiteSettings } = useWebsiteSettings();

    const isAdmin = user?.role === 'admin';

    return (
        <aside
            className={cn(
                "hidden lg:flex relative h-screen flex-col border-r border-[#1e1e20] bg-[#121214] transition-all duration-300 z-50",
                collapsed ? "w-20" : "w-64"
            )}
        >
            <SidebarContent
                collapsed={collapsed}
                user={user}
                signOut={signOut}
                websiteSettings={websiteSettings}
                location={location}
                isAdmin={isAdmin}
            />

            {/* Collapse Toggle */}
            <button
                onClick={() => setCollapsed(!collapsed)}
                className="absolute -right-3 top-20 bg-[#121214] border border-[#1e1e20] text-zinc-400 p-1 rounded-full shadow-xl hover:text-white hover:border-zinc-700 transition-all z-50"
            >
                {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
            </button>
        </aside>
    );
}
