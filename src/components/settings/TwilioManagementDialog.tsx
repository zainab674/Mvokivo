"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { TwilioIntegrationCard } from "./integrations/TwilioIntegrationCard";
import { Phone } from "lucide-react";
import type { TwilioIntegration } from "./integrations/types";

interface TwilioManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    twilioIntegrations: TwilioIntegration[];
    handleTwilioConnect: (data: any) => Promise<void>;
    handleRemoveIntegration: (id: string) => Promise<void>;
}

export function TwilioManagementDialog({
    open,
    onOpenChange,
    twilioIntegrations,
    handleTwilioConnect,
    handleRemoveIntegration
}: TwilioManagementDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl rounded-[32px] overflow-hidden p-0">
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#f22f46]/10 flex items-center justify-center border border-[#f22f46]/20">
                                <Phone className="h-6 w-6 text-[#f22f46]" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Twilio Integrations</DialogTitle>
                                <p className="text-muted-foreground text-sm">Manage your connected Twilio accounts.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <TwilioIntegrationCard
                        integrations={twilioIntegrations}
                        onSuccess={handleTwilioConnect}
                        onRemove={handleRemoveIntegration}
                        onRefresh={async () => { }}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
