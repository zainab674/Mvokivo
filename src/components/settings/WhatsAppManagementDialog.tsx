"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { WhatsAppIntegrationCard } from "./WhatsAppIntegrationCard";
import { MessageSquare } from "lucide-react";

interface WhatsAppManagementDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    whatsappIntegrations: any[];
    onIntegrationsChange: (integrations: any[]) => void;
}

export function WhatsAppManagementDialog({
    open,
    onOpenChange,
    whatsappIntegrations,
    onIntegrationsChange
}: WhatsAppManagementDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl rounded-[32px] overflow-hidden p-0">
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-[#25D366]/10 flex items-center justify-center border border-[#25D366]/20">
                                <MessageSquare className="h-6 w-6 text-[#25D366]" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight">WhatsApp Integrations</DialogTitle>
                                <p className="text-muted-foreground text-sm">Manage your connected WhatsApp Business accounts.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <WhatsAppIntegrationCard
                        integrations={whatsappIntegrations}
                        onIntegrationsChange={onIntegrationsChange}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
