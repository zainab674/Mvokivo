
import React from "react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { ThemeToggleMinimal } from "@/components/ThemeToggle";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Bell, Search, User, CreditCard, LogOut, Settings as SettingsIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAccountMinutes } from "@/hooks/useAccountMinutes";

export default function DashboardHeader() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const { remainingMinutes, percentageUsed, isLoading: minutesLoading } = useAccountMinutes();

    return (
        <header className="h-16 w-full border-b border-white/5 bg-black/20 backdrop-blur-sm flex items-center justify-between px-6 z-40">
            {/* Left Side (Breadcrumbs or Page Title) */}
            <div className="flex items-center gap-4">
                {/* Placeholder for future breadcrumbs */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-9 w-64 rounded-full bg-white/5 border border-white/10 pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Right Side (Actions) */}
            <div className="flex items-center gap-4">
                {/* Helper Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-white/5 hover:text-white rounded-full">
                        <Bell size={18} />
                    </Button>
                    <ThemeToggleMinimal />
                </div>

                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full transition-all hover:scale-105 p-0 overflow-hidden ring-2 ring-white/10">
                            <Avatar className="h-full w-full">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                                    {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-2 bg-zinc-950/95 border-zinc-800 backdrop-blur-xl text-zinc-200 rounded-xl shadow-2xl">
                        <div className="p-3 border-b border-white/10 mb-2">
                            <p className="font-medium text-white">{user?.fullName || 'User'}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                            {!minutesLoading && (
                                <div className="mt-2 flex items-center gap-2 text-xs bg-white/5 p-2 rounded-lg">
                                    <div className={cn("w-2 h-2 rounded-full", percentageUsed > 90 ? "bg-red-500" : "bg-emerald-500")} />
                                    <span>{remainingMinutes.toLocaleString()} mins left</span>
                                </div>
                            )}
                        </div>

                        <DropdownMenuItem asChild className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer mb-1">
                            <Link to="/settings?tab=account&subtab=profile" className="flex items-center gap-2">
                                <User size={16} /> Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer mb-1">
                            <Link to="/settings" className="flex items-center gap-2">
                                <SettingsIcon size={16} /> Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-white/10 focus:text-white cursor-pointer mb-1">
                            <Link to="/billing" className="flex items-center gap-2">
                                <CreditCard size={16} /> Billing
                            </Link>
                        </DropdownMenuItem>

                        <div className="h-px bg-white/10 my-1" />

                        <DropdownMenuItem
                            onClick={() => {
                                signOut();
                                navigate('/');
                            }}
                            className="rounded-lg text-red-400 focus:bg-red-500/10 focus:text-red-400 cursor-pointer"
                        >
                            <div className="flex items-center gap-2">
                                <LogOut size={16} /> Sign Out
                            </div>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}
