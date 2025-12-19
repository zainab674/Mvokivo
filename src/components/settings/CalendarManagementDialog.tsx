"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { CalendarIntegrationCard } from "./CalendarIntegrationCard";
import { Calendar } from "lucide-react";
import type { UserCalendarCredentials } from "@/lib/calendar-credentials";

interface CalendarManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    calendarIntegrations: UserCalendarCredentials[];
    handleCalendarConnect: (data: any) => Promise<void>;
    handleRemoveCalendarIntegration: (id: string) => Promise<void>;
}

export function CalendarManagementDialog({
    open,
    onOpenChange,
    calendarIntegrations,
    handleCalendarConnect,
    handleRemoveCalendarIntegration
}: CalendarManagementDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl rounded-[32px] overflow-hidden p-0">
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#292929]/10 flex items-center justify-center border border-[#292929]/20">
                                <Calendar className="h-6 w-6 text-[#292929]" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Cal.com Integrations</DialogTitle>
                                <p className="text-muted-foreground text-sm">Manage your connected Cal.com accounts.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <CalendarIntegrationCard
                        integrations={calendarIntegrations}
                        onSuccess={handleCalendarConnect}
                        onRemove={handleRemoveCalendarIntegration}
                        onRefresh={async () => { }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
