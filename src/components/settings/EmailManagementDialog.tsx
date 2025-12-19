"use client";

import React from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { EmailIntegrationCard } from "./EmailIntegrationCard";
import { Mail } from "lucide-react";

interface EmailManagementDialogProps {
    children?: React.ReactNode;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    emailIntegrations: any[];
    handleEmailConnect: (data: any) => Promise<void>;
    handleRemoveEmailIntegration: (email: string) => Promise<void>;
}

export function EmailManagementDialog({
    children,
    open,
    onOpenChange,
    emailIntegrations,
    handleEmailConnect,
    handleRemoveEmailIntegration
}: EmailManagementDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            {children && (
                <DialogTrigger asChild>
                    {children}
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] bg-card/95 backdrop-blur-2xl border-border/40 shadow-2xl rounded-[32px] overflow-hidden p-0">
                <div className="p-8">
                    <DialogHeader className="mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Mail className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-2xl font-bold tracking-tight">Email Integrations</DialogTitle>
                                <p className="text-muted-foreground text-sm">Manage your connected SMTP/IMAP accounts.</p>
                            </div>
                        </div>
                    </DialogHeader>

                    <EmailIntegrationCard
                        integrations={emailIntegrations}
                        onSuccess={handleEmailConnect}
                        onRemove={handleRemoveEmailIntegration}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}
