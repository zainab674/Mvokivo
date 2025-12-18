"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmailAuthDialog } from "./EmailAuthDialog";
import { Mail, CheckCircle2, Trash2 } from "lucide-react";

interface EmailIntegrationCardProps {
    integrations: any[];
    onSuccess: (data: any) => void;
    onRemove: (email: string) => void;
}

export function EmailIntegrationCard({
    integrations,
    onSuccess,
    onRemove,
}: EmailIntegrationCardProps) {

    if (integrations.length === 0) {
        return (
            <Card className="border-border/60 bg-card/50 backdrop-blur-sm shadow-none">
                <CardContent className="p-6 text-center">
                    <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No Email Integrations</h3>
                    <p className="text-muted-foreground mb-4 text-sm">
                        Connect your email to enable assistant email replies and campaigns.
                    </p>
                    <EmailAuthDialog onSuccess={onSuccess}>
                        <Button>
                            <Mail className="mr-2 h-4 w-4" />
                            Connect Email
                        </Button>
                    </EmailAuthDialog>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Active Integrations</h3>
                <EmailAuthDialog onSuccess={onSuccess}>
                    <Button variant="ghost" size="sm" className="h-8 text-xs">
                        <Plus className="w-3 h-3 mr-1" /> Add New
                    </Button>
                </EmailAuthDialog>
            </div>
            {integrations.map((integration, idx) => (
                <Card key={idx} className="border-border/60 bg-card/50 backdrop-blur-sm shadow-none hover:border-border transition-colors">
                    <CardHeader className="pb-3 px-6 pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-base font-semibold">{integration.email}</CardTitle>
                                    <p className="text-xs text-muted-foreground">{integration.provider?.toUpperCase()} • {integration.smtpHost}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                {integration.isActive && (
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                                        Active
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => onRemove(integration.email)}
                                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            ))}
        </div>
    );
}

import { Plus } from "lucide-react";
