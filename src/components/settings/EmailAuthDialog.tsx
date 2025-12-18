"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailAuthDialogProps {
    children?: React.ReactNode;
    onSuccess: (data: any) => void;
}

export function EmailAuthDialog({ children, onSuccess }: EmailAuthDialogProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const { toast } = useToast();

    const [formData, setFormData] = useState({
        email: "",
        smtpHost: "",
        smtpPort: "587",
        smtpUser: "",
        smtpPass: "",
        imapHost: "",
        imapPort: "993",
        imapUser: "",
        imapPass: ""
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (!formData.email || !formData.smtpHost || !formData.smtpUser || !formData.smtpPass) {
                throw new Error("Please fill in all required SMTP fields");
            }

            await onSuccess({
                ...formData,
                provider: 'smtp',
                smtpPort: parseInt(formData.smtpPort),
                imapPort: parseInt(formData.imapPort)
            });

            setOpen(false);
            setFormData({
                email: "",
                smtpHost: "",
                smtpPort: "587",
                smtpUser: "",
                smtpPass: "",
                imapHost: "",
                imapPort: "993",
                imapUser: "",
                imapPass: ""
            });
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to save email settings",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                {children || <Button>Connect Email</Button>}
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] overflow-y-auto max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle>Connect Email Account</DialogTitle>
                    <DialogDescription>
                        Enter your SMTP and IMAP details to enable email features.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="assistant@example.com"
                            required
                        />
                    </div>

                    <div className="grid gap-4 py-2">
                        <h4 className="text-sm font-medium leading-none">SMTP Settings (Sending)</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <Label htmlFor="smtpHost">Host</Label>
                                <Input
                                    id="smtpHost"
                                    value={formData.smtpHost}
                                    onChange={(e) => setFormData({ ...formData, smtpHost: e.target.value })}
                                    placeholder="smtp.gmail.com"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="smtpPort">Port</Label>
                                <Input
                                    id="smtpPort"
                                    value={formData.smtpPort}
                                    onChange={(e) => setFormData({ ...formData, smtpPort: e.target.value })}
                                    placeholder="587"
                                    required
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtpUser">Username</Label>
                            <Input
                                id="smtpUser"
                                value={formData.smtpUser}
                                onChange={(e) => setFormData({ ...formData, smtpUser: e.target.value })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="smtpPass">Password</Label>
                            <Input
                                id="smtpPass"
                                type="password"
                                value={formData.smtpPass}
                                onChange={(e) => setFormData({ ...formData, smtpPass: e.target.value })}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid gap-4 py-2">
                        <h4 className="text-sm font-medium leading-none">IMAP Settings (Receiving)</h4>
                        <div className="grid grid-cols-3 gap-2">
                            <div className="col-span-2">
                                <Label htmlFor="imapHost">Host</Label>
                                <Input
                                    id="imapHost"
                                    value={formData.imapHost}
                                    onChange={(e) => setFormData({ ...formData, imapHost: e.target.value })}
                                    placeholder="imap.gmail.com"
                                />
                            </div>
                            <div>
                                <Label htmlFor="imapPort">Port</Label>
                                <Input
                                    id="imapPort"
                                    value={formData.imapPort}
                                    onChange={(e) => setFormData({ ...formData, imapPort: e.target.value })}
                                    placeholder="993"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imapUser">Username</Label>
                            <Input
                                id="imapUser"
                                value={formData.imapUser}
                                onChange={(e) => setFormData({ ...formData, imapUser: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="imapPass">Password</Label>
                            <Input
                                id="imapPass"
                                type="password"
                                value={formData.imapPass}
                                onChange={(e) => setFormData({ ...formData, imapPass: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                "Connect"
                            )}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
