
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

import { Bell, Search, User, CreditCard, LogOut, Settings as SettingsIcon, Menu } from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useAccountMinutes } from "@/hooks/useAccountMinutes";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { SidebarContent } from "@/components/navigation/Sidebar";
import { useWebsiteSettings } from "@/contexts/WebsiteSettingsContext";

export default function DashboardHeader() {
    const { user, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const { websiteSettings } = useWebsiteSettings();
    const { remainingMinutes, percentageUsed, isLoading: minutesLoading } = useAccountMinutes();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

    return (
        <header className="h-16 w-full border-b border-border bg-background/80 backdrop-blur-sm flex items-center justify-between px-4 md:px-6 z-40">
            {/* Left Side (Breadcrumbs or Page Title or Mobile Menu) */}
            <div className="flex items-center gap-4">
                {/* Mobile Menu Trigger */}
                <div className="lg:hidden">
                    <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
                        <SheetTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-muted-foreground mr-2">
                                <Menu size={20} />
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="left" className="p-0 w-72 bg-[#121214] border-r-border">
                            <SidebarContent
                                collapsed={false}
                                user={user}
                                signOut={signOut}
                                websiteSettings={websiteSettings}
                                location={location}
                                isAdmin={user?.role === 'admin'}
                                onClose={() => setIsMobileMenuOpen(false)}
                            />
                        </SheetContent>
                    </Sheet>
                </div>

                {/* Placeholder for future breadcrumbs */}
                <div className="hidden md:flex items-center relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search..."
                        className="h-9 w-64 rounded-full bg-secondary/50 border border-border pl-9 pr-4 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    />
                </div>
            </div>

            {/* Right Side (Actions) */}
            <div className="flex items-center gap-4">
                {/* Helper Actions */}
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-full">
                        <Bell size={18} />
                    </Button>
                    <ThemeToggleMinimal />
                </div>

                {/* User Profile */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-9 w-9 rounded-full transition-all hover:scale-105 p-0 overflow-hidden ring-2 ring-border">
                            <Avatar className="h-full w-full">
                                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-medium">
                                    {user?.fullName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64 p-2 bg-popover/95 border-border backdrop-blur-xl text-popover-foreground rounded-xl shadow-2xl">
                        <div className="p-3 border-b border-border mb-2">
                            <p className="font-medium text-foreground">{user?.fullName || 'User'}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                            {!minutesLoading && (
                                <div className="mt-2 flex items-center gap-2 text-xs bg-secondary p-2 rounded-lg">
                                    <div className={cn("w-2 h-2 rounded-full", percentageUsed > 90 ? "bg-red-500" : "bg-emerald-500")} />
                                    <span>{remainingMinutes.toLocaleString()} mins left</span>
                                </div>
                            )}
                        </div>

                        <DropdownMenuItem asChild className="rounded-lg focus:bg-accent focus:text-accent-foreground cursor-pointer mb-1">
                            <Link to="/settings?tab=account&subtab=profile" className="flex items-center gap-2">
                                <User size={16} /> Profile
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-accent focus:text-accent-foreground cursor-pointer mb-1">
                            <Link to="/settings" className="flex items-center gap-2">
                                <SettingsIcon size={16} /> Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-lg focus:bg-accent focus:text-accent-foreground cursor-pointer mb-1">
                            <Link to="/billing" className="flex items-center gap-2">
                                <CreditCard size={16} /> Billing
                            </Link>
                        </DropdownMenuItem>

                        <div className="h-px bg-border my-1" />

                        <DropdownMenuItem
                            onClick={() => {
                                signOut();
                                navigate('/');
                            }}
                            className="rounded-lg text-red-500 focus:bg-red-500/10 focus:text-red-600 cursor-pointer"
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
