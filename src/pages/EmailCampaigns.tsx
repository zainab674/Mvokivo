import { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { ThemeCard } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Mail, RefreshCw, Play, BarChart3, Clock, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { EmailCampaignSettingsDialog } from "@/components/campaigns/EmailCampaignSettingsDialog";
import { fetchEmailCampaigns, createEmailCampaign, startEmailCampaign, EmailCampaign } from "@/lib/api/emailCampaigns";

export default function EmailCampaigns() {
    const { toast } = useToast();
    const [campaigns, setCampaigns] = useState<EmailCampaign[]>([]);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    const loadCampaigns = async () => {
        setLoading(true);
        try {
            const res = await fetchEmailCampaigns();
            if (res.success) {
                setCampaigns(res.campaigns);
            }
        } catch (error) {
            console.error("Failed to fetch campaigns", error);
            toast({
                title: "Error",
                description: "Failed to load email campaigns",
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadCampaigns();
    }, []);

    const handleCreate = async (formData: FormData) => {
        try {
            await createEmailCampaign(formData);
            toast({
                title: "Success",
                description: "Campaign created successfully!",
            });
            loadCampaigns();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create campaign",
                variant: "destructive"
            });
            throw error;
        }
    };

    const handleStart = async (campaignId: string) => {
        try {
            await startEmailCampaign(campaignId);
            toast({
                title: "Started",
                description: "The campaign outreach is now in progress.",
            });
            loadCampaigns();
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to start: " + error.message,
                variant: "destructive"
            });
        }
    };

    const getStatusBadge = (status: string) => {
        const variants: any = {
            draft: 'secondary',
            sending: 'default',
            completed: 'outline',
            failed: 'destructive',
            paused: 'warning'
        };
        const variant = variants[status] || 'secondary';

        let className = "px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase";
        if (status === 'completed') className += " bg-emerald-500/10 text-emerald-600 border-emerald-500/20";
        if (status === 'sending') className += " bg-primary/10 text-primary animate-pulse border-primary/20";
        if (status === 'draft') className += " bg-secondary text-muted-foreground opacity-70";

        return <Badge variant={variant === 'outline' ? 'outline' : variant} className={className}>{status}</Badge>;
    };

    return (
        <DashboardLayout>
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 sm:space-y-8">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mb-2 flex items-center flex-wrap gap-2">
                            Email Campaigns
                            <Badge variant="secondary" className="bg-primary/5 text-primary border-primary/10 h-6 text-[10px] uppercase font-bold tracking-wider">Early Access</Badge>
                        </h1>
                        <p className="text-muted-foreground text-sm max-w-2xl">Design and automate high-conversion email outreach with AI agents.</p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-9 sm:h-10 px-3 sm:px-4 rounded-xl border-border/60 hover:bg-secondary/50 flex-1 sm:flex-none"
                            onClick={loadCampaigns}
                        >
                            <RefreshCw className={`h-4 w-4 mr-1.5 sm:mr-2 ${loading ? 'animate-spin' : ''}`} /> Sync
                        </Button>
                        <Button
                            className="h-9 sm:h-10 px-4 sm:px-6 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5 flex-1 sm:flex-none text-xs sm:text-sm"
                            onClick={() => setDialogOpen(true)}
                        >
                            <Plus className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" /> Launch Campaign
                        </Button>
                    </div>
                </div>

                {loading && campaigns.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 sm:py-24 gap-4">
                        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin text-primary opacity-40" />
                        <p className="text-sm text-muted-foreground font-medium animate-pulse">Scanning server for campaigns...</p>
                    </div>
                ) : campaigns.length === 0 ? (
                    <div className="text-center py-20 sm:py-32 bg-card/20 border border-dashed border-border/60 rounded-[30px] sm:rounded-[40px] backdrop-blur-sm px-6">
                        <div className="w-16 h-16 sm:w-24 sm:h-24 bg-primary/5 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/10 shadow-inner">
                            <Mail className="h-8 w-8 sm:h-12 sm:w-12 text-primary/30" />
                        </div>
                        <h2 className="text-xl sm:text-2xl font-black mb-3">Silent Inbox?</h2>
                        <p className="text-muted-foreground mb-8 max-w-sm mx-auto text-xs sm:text-sm leading-relaxed">Reach out to your prospects automatically. Connect your assistant and start a thread with thousands instantly.</p>
                        <Button size="lg" className="w-full sm:w-auto rounded-xl sm:rounded-2xl px-8 sm:px-12 h-12 sm:h-14 text-sm sm:text-base font-bold shadow-2xl shadow-primary/30 active:scale-95 transition-all" onClick={() => setDialogOpen(true)}>
                            <Plus className="mr-2 h-5 w-5 sm:h-6 sm:w-6" /> Create First Campaign
                        </Button>
                    </div>
                ) : (
                    <ThemeCard variant="glass" className="overflow-hidden border-border/20 rounded-2xl sm:rounded-3xl shadow-xl">
                        <div className="overflow-x-auto custom-scrollbar">
                            <Table>
                                <TableHeader className="bg-secondary/5">
                                    <TableRow className="border-border/10">
                                        <TableHead className="py-4 px-4 sm:px-6 font-black uppercase text-[9px] sm:text-[10px] tracking-widest text-muted-foreground/60 min-w-[100px]">Status</TableHead>
                                        <TableHead className="py-4 px-4 sm:px-6 font-black uppercase text-[9px] sm:text-[10px] tracking-widest text-muted-foreground/60 min-w-[200px]">Project Name</TableHead>
                                        <TableHead className="py-4 px-4 sm:px-6 font-black uppercase text-[9px] sm:text-[10px] tracking-widest text-muted-foreground/60 min-w-[140px]">Agent</TableHead>
                                        <TableHead className="py-4 px-4 sm:px-6 font-black uppercase text-[9px] sm:text-[10px] tracking-widest text-muted-foreground/60 min-w-[240px]">Success Metrics</TableHead>
                                        <TableHead className="py-4 px-4 sm:px-6 font-black uppercase text-[9px] sm:text-[10px] tracking-widest text-muted-foreground/60 text-right">Control</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {campaigns.map(campaign => (
                                        <TableRow key={campaign._id} className="border-border/10 hover:bg-secondary/5 transition-all group">
                                            <TableCell className="py-4 sm:py-6 px-4 sm:px-6">{getStatusBadge(campaign.status)}</TableCell>
                                            <TableCell className="py-4 sm:py-6 px-4 sm:px-6">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm sm:text-base tracking-tight line-clamp-1">{campaign.name}</span>
                                                    <div className="flex items-center gap-2 text-[10px] sm:text-[11px] text-muted-foreground mt-1 sm:mt-1.5 opacity-60">
                                                        <Clock className="w-3 h-3" />
                                                        {new Date(campaign.created_at || (campaign as any).createdAt).toLocaleDateString()}
                                                        <span className="mx-1">•</span>
                                                        <span className="truncate max-w-[150px] font-medium">{campaign.subject}</span>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 sm:py-6 px-4 sm:px-6">
                                                <div className="flex items-center gap-2 sm:gap-2.5">
                                                    <div className="w-7 h-7 sm:w-8 sm:h-8 bg-primary/10 rounded-lg sm:rounded-xl flex items-center justify-center border border-primary/20">
                                                        <BarChart3 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-bold tracking-tight truncate max-w-[100px]">{typeof campaign.assistantId === 'object' ? campaign.assistantId?.name : 'AI Agent'}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 sm:py-6 px-4 sm:px-6">
                                                <div className="flex items-center gap-6 sm:gap-10">
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] sm:text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest mb-1.5 sm:mb-2">Sent / Total</span>
                                                        <div className="flex items-center gap-2 sm:gap-3">
                                                            <span className="text-sm sm:text-lg font-black">{campaign.stats?.sent || 0}</span>
                                                            <div className="hidden sm:block h-1 w-12 sm:h-1.5 sm:w-16 bg-secondary rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full bg-primary transition-all duration-700"
                                                                    style={{ width: `${Math.min(100, (campaign.stats?.sent || 0) / (campaign.totalRecipients || 1) * 100)}%` }}
                                                                />
                                                            </div>
                                                            <span className="text-[9px] sm:text-[10px] text-muted-foreground font-bold">{campaign.totalRecipients || 0}</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[9px] sm:text-[10px] font-black text-emerald-600/50 uppercase tracking-widest mb-1.5 sm:mb-2">Replies</span>
                                                        <div className="flex items-baseline gap-1.5 sm:gap-2">
                                                            <span className="text-sm sm:text-lg font-black text-emerald-600">{campaign.stats?.replies || 0}</span>
                                                            <span className="text-[9px] sm:text-[10px] font-black text-emerald-600/60">
                                                                ({((campaign.stats?.replies || 0) / (campaign.stats?.sent || 1) * 100).toFixed(1)}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4 sm:py-6 px-4 sm:px-6 text-right">
                                                {(campaign.status === 'draft' || campaign.status === 'failed') ? (
                                                    <Button
                                                        variant="secondary"
                                                        className="h-8 sm:h-9 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-lg sm:rounded-xl px-3 sm:px-5 text-xs font-bold shadow-sm whitespace-nowrap"
                                                        onClick={() => handleStart(campaign._id)}
                                                    >
                                                        <Play className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
                                                        <span className="hidden sm:inline">Start Now</span>
                                                        <span className="sm:hidden">Start</span>
                                                    </Button>
                                                ) : campaign.status === 'sending' ? (
                                                    <div className="flex items-center justify-end gap-1.5 sm:gap-2 text-primary font-black text-[9px] sm:text-[10px] uppercase tracking-widest animate-pulse">
                                                        <div className="h-1.5 w-1.5 sm:h-2 sm:w-2 bg-primary rounded-full" />
                                                        <span className="hidden sm:inline">Outreach Active</span>
                                                        <span className="sm:hidden">Sending</span>
                                                    </div>
                                                ) : (
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg sm:rounded-xl opacity-30 cursor-default">
                                                        <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5" />
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </ThemeCard>
                )}
            </div>

            <EmailCampaignSettingsDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                onSave={handleCreate}
            />
        </DashboardLayout>
    );
}
