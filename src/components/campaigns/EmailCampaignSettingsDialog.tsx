"use client";

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, Sparkles, Mail, Users, FileText, Paperclip } from "lucide-react";
import { getAccessToken } from "@/lib/auth";

// APIs
import { fetchContactLists } from "@/lib/api/contacts/fetchContactLists";
import { fetchCsvFiles } from "@/lib/api/csv/fetchCsvFiles";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

interface EmailCampaignSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (formData: FormData) => Promise<void>;
}

export function EmailCampaignSettingsDialog({ open, onOpenChange, onSave }: EmailCampaignSettingsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [enhancing, setEnhancing] = useState(false);

    // Form State
    const [name, setName] = useState('');
    const [assistantId, setAssistantId] = useState('');
    const [emailAccountId, setEmailAccountId] = useState('');
    const [contactSource, setContactSource] = useState<'contact_list' | 'csv_file'>('contact_list');
    const [sourceId, setSourceId] = useState('');
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [attachment, setAttachment] = useState<File | null>(null);

    // Data State
    const [assistants, setAssistants] = useState<any[]>([]);
    const [accounts, setAccounts] = useState<any[]>([]);
    const [contactLists, setContactLists] = useState<any[]>([]);
    const [csvFiles, setCsvFiles] = useState<any[]>([]);

    useEffect(() => {
        if (open) {
            loadData();
        }
    }, [open]);

    const loadData = async () => {
        setLoading(true);
        try {
            const token = getAccessToken();
            const headers = token ? { Authorization: `Bearer ${token}` } : {};

            // 1. Assistants
            const asstRes = await fetch(`${API_URL}/api/v1/assistants`, { headers });
            const asstData = await asstRes.json();
            const asstList = Array.isArray(asstData) ? asstData : (asstData.assistants || []);
            setAssistants(asstList);

            // 2. Email Integrations
            const intRes = await fetch(`${API_URL}/api/v1/integrations`, { headers });
            const intData = await intRes.json();
            let emailIntegrations = [];
            if (intData.email && Array.isArray(intData.email)) {
                emailIntegrations = intData.email;
            }
            setAccounts(emailIntegrations.filter((i: any) => i.isActive !== false));

            // 3. Contact Lists
            try {
                const lists = await fetchContactLists();
                setContactLists(lists.contactLists || []);
            } catch (e) {
                console.error("Failed to load contact lists", e);
            }

            // 4. CSV Files
            try {
                const csvs = await fetchCsvFiles();
                setCsvFiles(csvs.csvFiles || []);
            } catch (e) {
                console.error("Failed to load csv files", e);
            }

        } catch (error) {
            console.error("Error loading form data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async () => {
        if (!name || !assistantId || !emailAccountId || !sourceId || !subject || !body) {
            alert("Please fill in all required fields.");
            return;
        }

        setSubmitting(true);
        try {
            const formData = new FormData();
            formData.append('name', name);
            formData.append('assistantId', assistantId);
            formData.append('emailIntegrationId', emailAccountId);
            formData.append('contactSource', contactSource);
            if (contactSource === 'contact_list') {
                formData.append('contactListId', sourceId);
            } else {
                formData.append('csvFileId', sourceId);
            }
            formData.append('subject', subject);
            formData.append('body', body);
            if (attachment) {
                formData.append('attachment', attachment);
            }

            await onSave(formData);
            onOpenChange(false);

            // Reset form
            setName('');
            setSubject('');
            setBody('');
            setAttachment(null);
            setAssistantId('');
            setEmailAccountId('');
            setSourceId('');

        } catch (error) {
            console.error(error);
            alert("Failed to create campaign.");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto p-0 gap-0 border-none shadow-2xl">
                <DialogHeader className="p-6 bg-primary/5 border-b border-primary/10">
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Mail className="w-6 h-6 text-primary" />
                        Create New Email Campaign
                    </DialogTitle>
                    <DialogDescription className="text-base">Configure your AI-powered email outreach campaign.</DialogDescription>
                </DialogHeader>

                {loading ? (
                    <div className="py-20 flex flex-col items-center gap-4">
                        <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground animate-pulse">Loading initial data...</p>
                    </div>
                ) : (
                    <div className="p-8 space-y-8">
                        {/* Section 1: Basics */}
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
                                    <FileText className="w-4 h-4" /> Campaign Name
                                </Label>
                                <Input
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="e.g. Q4 Real Estate Outreach"
                                    className="h-12 text-lg font-medium border-border/50 focus:border-primary/50 transition-all shadow-sm"
                                />
                            </div>

                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">AI Assistant (Replier)</Label>
                                    <Select value={assistantId} onValueChange={setAssistantId}>
                                        <SelectTrigger className="h-11 border-border/50 shadow-sm bg-background/50">
                                            <SelectValue placeholder="Select Assistant" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {assistants.map((a: any) => (
                                                <SelectItem key={a.id || a._id} value={a.id || a._id}>{a.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Sender Account</Label>
                                    <Select value={emailAccountId} onValueChange={setEmailAccountId}>
                                        <SelectTrigger className="h-11 border-border/50 shadow-sm bg-background/50">
                                            <SelectValue placeholder="Select Email" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {accounts.map((a: any) => (
                                                <SelectItem key={a.id || a._id} value={a.id || a._id}>{a.email}</SelectItem>
                                            ))}
                                            {accounts.length === 0 && (
                                                <div className="p-4 text-center">
                                                    <p className="text-xs text-muted-foreground mb-2">No email accounts connected.</p>
                                                    <Button variant="outline" size="sm" onClick={() => window.location.href = '/dashboard/settings'}>Go to Settings</Button>
                                                </div>
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Audience */}
                        <div className="p-6 border border-primary/20 rounded-2xl bg-primary/5 space-y-4">
                            <h3 className="text-sm font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                                <Users className="w-4 h-4" /> Audience Selection
                            </h3>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold">Source Type</Label>
                                    <Select value={contactSource} onValueChange={(v: any) => { setContactSource(v); setSourceId(''); }}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="contact_list">Contact List</SelectItem>
                                            <SelectItem value="csv_file">CSV File</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-xs font-semibold">{contactSource === 'contact_list' ? 'Target List' : 'Target CSV'}</Label>
                                    <Select value={sourceId} onValueChange={setSourceId}>
                                        <SelectTrigger className="bg-background">
                                            <SelectValue placeholder="Select data sources..." />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {contactSource === 'contact_list' ? (
                                                contactLists.map((l: any) => (
                                                    <SelectItem key={l.id} value={l.id}>{l.name} <span className="opacity-50 ml-1">({l.count} contacts)</span></SelectItem>
                                                ))
                                            ) : (
                                                csvFiles.map((f: any) => (
                                                    <SelectItem key={f._id} value={f._id}>{f.name} <span className="opacity-50 ml-1">({f.rowCount} rows)</span></SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Section 3: Content */}
                        <div className="space-y-4 pt-4 border-t">
                            <div className="grid gap-2">
                                <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70 flex items-center gap-2">
                                    Subject
                                </Label>
                                <Input
                                    value={subject}
                                    onChange={e => setSubject(e.target.value)}
                                    placeholder="The perfect first impression..."
                                    className="h-11 border-border/50 shadow-sm"
                                />
                            </div>
                            <div className="grid gap-2">
                                <div className="flex justify-between items-center px-1">
                                    <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground/70">Message Body</Label>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs gap-2 text-primary hover:bg-primary/10 rounded-full px-3"
                                        disabled={!body || enhancing}
                                        onClick={async () => {
                                            if (!body) return;
                                            setEnhancing(true);
                                            try {
                                                const token = getAccessToken();
                                                const headers: any = { 'Content-Type': 'application/json' };
                                                if (token) headers['Authorization'] = `Bearer ${token}`;

                                                const res = await fetch(`${API_URL}/api/v1/ai/enhance-text`, {
                                                    method: 'POST',
                                                    headers,
                                                    body: JSON.stringify({
                                                        text: body,
                                                        instruction: "Improve this email content to be professional, engaging, and clear."
                                                    })
                                                });
                                                const data = await res.json();
                                                if (data.content) {
                                                    setBody(data.content);
                                                }
                                            } catch (e) {
                                                console.error("Enhancement failed", e);
                                            } finally {
                                                setEnhancing(false);
                                            }
                                        }}
                                    >
                                        {enhancing ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                                        Enhance with AI
                                    </Button>
                                </div>
                                <Textarea
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Hi {name}, I'm reaching out because..."
                                    className="min-h-[200px] text-base leading-relaxed p-4 border-border/50 shadow-sm focus:border-primary/50 transition-all resize-none bg-background/50"
                                />
                            </div>
                            <div className="flex items-center gap-4 p-4 border rounded-xl bg-secondary/5 border-dashed border-muted-foreground/20">
                                <div className="w-10 h-10 rounded-lg bg-background flex items-center justify-center border shadow-sm">
                                    <Paperclip className="w-5 h-5 text-muted-foreground" />
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium">Attachment (Optional)</p>
                                    <p className="text-xs text-muted-foreground">PDF, JPG, PNG up to 10MB</p>
                                </div>
                                <Input type="file" className="w-[200px] h-9 text-xs" onChange={e => setAttachment(e.target.files?.[0] || null)} />
                            </div>
                        </div>
                    </div>
                )}

                <DialogFooter className="p-6 bg-secondary/20 border-t flex items-center justify-between sm:justify-between">
                    <Button variant="ghost" className="rounded-xl px-6" onClick={() => onOpenChange(false)}>Discard</Button>
                    <Button
                        onClick={handleSubmit}
                        className="rounded-xl px-8 h-11 text-base shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5"
                        disabled={submitting || loading}
                    >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {submitting ? 'Creating...' : 'Create & Start Campaign'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
