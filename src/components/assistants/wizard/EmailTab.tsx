import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Wand2, Loader2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface EmailTabProps {
    data: {
        subject: string;
        body: string;
        fromEmail: string;
    };
    assistantName: string;
    onChange: (data: any) => void;
}

export function EmailTab({ data, assistantName, onChange }: EmailTabProps) {
    const { toast } = useToast();
    const [isGenerating, setIsGenerating] = useState(false);
    const [emails, setEmails] = useState<any[]>([]);
    const [loadingEmails, setLoadingEmails] = useState(true);

    useEffect(() => {
        const loadIntegrations = async () => {
            try {
                const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/v1/integrations`, {
                    headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
                });
                const integrationData = await res.json();
                setEmails(integrationData.email || []);
            } catch (error) {
                console.error("Error loading email integrations:", error);
            } finally {
                setLoadingEmails(false);
            }
        };
        loadIntegrations();
    }, []);

    const handleGenerate = async () => {
        setIsGenerating(true);
        try {
            const token = localStorage.getItem('auth_token');
            const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/v1/ai/enhance-text`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    text: data.body || `Professional follow-up email for ${assistantName}`,
                    context: `This is a post-call email sent by an AI assistant named ${assistantName}. It should be professional, welcoming, and summarize the goal of provided information.`
                })
            });

            if (!response.ok) throw new Error('Generation failed');

            const result = await response.json();
            onChange({ ...data, body: result.enhancedText });
            toast({ title: "Email content updated via AI" });

        } catch (error) {
            console.error(error);
            toast({ title: "Failed to generate email", variant: "destructive" });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="space-y-8 max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20">
                    <Mail className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Post-Call Email</h2>
                    <p className="text-muted-foreground text-sm">Automate your follow-up sequence after every conversation.</p>
                </div>
            </div>

            <Card className="p-8 bg-card/40 backdrop-blur-xl border-border/40 shadow-2xl rounded-3xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-12 -mr-16 -mt-16 bg-primary/5 rounded-full blur-3xl opacity-50 group-hover:opacity-80 transition-opacity" />

                <div className="relative space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">Sender Account</Label>
                            <Select
                                value={data.fromEmail}
                                onValueChange={(value) => onChange({ ...data, fromEmail: value })}
                                disabled={loadingEmails}
                            >
                                <SelectTrigger className="h-12 bg-background/50 border-border/40 rounded-xl focus:ring-primary/20">
                                    <SelectValue placeholder="Select connected email" />
                                </SelectTrigger>
                                <SelectContent className="bg-card/95 backdrop-blur-xl border-border/40 rounded-xl">
                                    {emails.map((email) => (
                                        <SelectItem key={email.email} value={email.email} className="py-3 focus:bg-primary/10">
                                            <div className="flex flex-col">
                                                <span className="font-bold">{email.email}</span>
                                                <span className="text-[10px] uppercase tracking-tighter opacity-50">{email.provider}</span>
                                            </div>
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {emails.length === 0 && !loadingEmails && (
                                <p className="text-xs text-destructive/80 font-medium px-1 flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-destructive rounded-full" />
                                    No email accounts connected.
                                </p>
                            )}
                        </div>

                        <div className="space-y-3">
                            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">Email Subject</Label>
                            <Input
                                value={data.subject}
                                onChange={(e) => onChange({ ...data, subject: e.target.value })}
                                placeholder="e.g. Summary of our call"
                                className="h-12 bg-background/50 border-border/40 rounded-xl px-4 focus:ring-primary/20"
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-sm font-black uppercase tracking-widest text-muted-foreground/70">Email Composition</Label>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleGenerate}
                                disabled={isGenerating}
                                className="h-9 gap-2 rounded-xl bg-primary/5 border-primary/20 text-primary hover:bg-primary hover:text-white transition-all shadow-sm"
                            >
                                {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                                AI Writer
                            </Button>
                        </div>

                        <div className="relative group/area">
                            <Textarea
                                value={data.body}
                                onChange={(e) => onChange({ ...data, body: e.target.value })}
                                placeholder="Write your personalized follow-up message here..."
                                className="min-h-[280px] bg-background/50 border-border/40 rounded-2xl p-6 text-base leading-relaxed focus:ring-primary/20 transition-all resize-none shadow-inner"
                            />
                            <div className="absolute bottom-4 right-4 text-[10px] text-muted-foreground/40 font-mono">
                                [Name] will be replaced automatically
                            </div>
                        </div>

                        <div className="bg-primary/5 border border-primary/10 rounded-2xl p-5 flex items-start gap-4">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Mail className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-sm font-bold text-primary mb-1">Dynamic Personalization</h4>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Use <code className="bg-primary/10 px-1 rounded">[Name]</code> or <code className="bg-primary/10 px-1 rounded">[Date]</code> in your body and they will be dynamically replaced with the caller's information.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
