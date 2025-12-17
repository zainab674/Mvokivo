import { useState, useEffect } from 'react';
import DashboardLayout from "@/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContainer, ThemeSection, ThemeCard } from "@/components/theme";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, Trash2, Plus, BarChart3, Eye, Download } from "lucide-react";
import { TermsOfUseDialog } from "@/components/campaigns/TermsOfUseDialog";
import { CampaignSettingsDialog } from "@/components/campaigns/CampaignSettingsDialog";
import { CampaignDetailsDialog } from "@/components/campaigns/CampaignDetailsDialog";
import { DeleteCampaignDialog } from "@/components/campaigns/DeleteCampaignDialog";
import { fetchCampaigns, Campaign } from "@/lib/api/campaigns/fetchCampaigns";
import { saveCampaign, SaveCampaignRequest } from "@/lib/api/campaigns/saveCampaign";
import { startCampaign } from "@/lib/api/campaigns/startCampaign";
import { pauseCampaign } from "@/lib/api/campaigns/pauseCampaign";
import { resumeCampaign } from "@/lib/api/campaigns/resumeCampaign";
import { stopCampaign } from "@/lib/api/campaigns/stopCampaign";
import { deleteCampaign as deleteCampaignAPI } from "@/lib/api/campaigns/deleteCampaign";
import { getCampaignStatus } from "@/lib/api/campaigns/getCampaignStatus";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { exportAllCampaignsData } from "@/lib/api/campaigns/exportCampaignData";
import { exportAllCampaignDataToExcel } from "@/lib/utils/excelExport";

// Campaign interface imported from API

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Q4 Sales Outreach',
    status: 'active',
    dailyCap: 100,
    agent: 'Sarah Johnson',
    list: 'Sales Prospects',
    dials: 847,
    pickups: 234,
    doNotCall: 12,
    outcomes: {
      interested: 45,
      notInterested: 156,
      callback: 33
    },
    totalUsage: 1250
  },
  {
    id: '2',
    name: 'Customer Support Follow-up',
    status: 'paused',
    dailyCap: 50,
    agent: 'Mike Chen',
    list: 'Support Tickets',
    dials: 156,
    pickups: 89,
    doNotCall: 3,
    outcomes: {
      interested: 67,
      notInterested: 18,
      callback: 4
    },
    totalUsage: 320
  }
];

export default function Campaigns() {
  const { user } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [termsOpen, setTermsOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');
  const [selectedCampaignName, setSelectedCampaignName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Load campaigns from database
  useEffect(() => {
    const loadCampaigns = async () => {
      if (!user?.id) return;

      try {
        const response = await fetchCampaigns();
        setCampaigns(response.campaigns);
      } catch (error) {
        console.error('Error loading campaigns:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCampaigns();
  }, [user?.id]);

  const handleNewCampaign = () => {
    setTermsOpen(true);
  };

  const handleTermsAccepted = () => {
    setTermsOpen(false);
    setSettingsOpen(true);
  };

  const handleCampaignCreated = async (campaignData: any) => {
    if (!user?.id) return;

    try {
      const saveData: SaveCampaignRequest = {
        name: campaignData.name,
        assistantId: campaignData.assistantId,
        contactSource: campaignData.contactSource,
        contactListId: campaignData.contactListId,
        csvFileId: campaignData.csvFileId,
        dailyCap: campaignData.dailyCap,
        callingDays: campaignData.callingDays,
        startHour: campaignData.startHour,
        endHour: campaignData.endHour,
        campaignPrompt: campaignData.campaignPrompt,
        userId: user.id
      };

      const result = await saveCampaign(saveData);

      if (result.success) {
        // Reload campaigns from database
        const response = await fetchCampaigns();
        setCampaigns(response.campaigns);
        setSettingsOpen(false);
      } else {
        console.error('Error saving campaign:', result.error);
        alert('Error saving campaign: ' + result.error);
      }
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  const toggleCampaignStatus = async (id: string) => {
    const campaign = campaigns.find(c => c.id === id);
    if (!campaign) return;

    try {
      if (campaign.execution_status === 'running') {
        // Pause the campaign
        const result = await pauseCampaign({ campaignId: id });
        if (result.success) {
          setCampaigns(prev => prev.map(c =>
            c.id === id
              ? { ...c, execution_status: 'paused' as const }
              : c
          ));
        } else {
          console.error('Error pausing campaign:', result.error);
        }
      } else if (campaign.execution_status === 'paused') {
        // Resume the campaign
        const result = await resumeCampaign({ campaignId: id });
        if (result.success) {
          setCampaigns(prev => prev.map(c =>
            c.id === id
              ? { ...c, execution_status: 'running' as const }
              : c
          ));
        } else {
          console.error('Error resuming campaign:', result.error);
        }
      } else if (campaign.execution_status === 'idle') {
        // Start the campaign
        const result = await startCampaign({ campaignId: id });
        if (result.success) {
          setCampaigns(prev => prev.map(c =>
            c.id === id
              ? { ...c, execution_status: 'running' as const }
              : c
          ));
        } else {
          console.error('Error starting campaign:', result.error);
        }
      }
    } catch (error) {
      console.error('Error toggling campaign status:', error);
    }
  };

  const handleDeleteCampaign = (id: string, name: string) => {
    setSelectedCampaignId(id);
    setSelectedCampaignName(name);
    setDeleteOpen(true);
  };

  const confirmDeleteCampaign = async () => {
    if (!selectedCampaignId) return;

    setDeleting(true);
    try {
      const result = await deleteCampaignAPI({ campaignId: selectedCampaignId });

      if (result.success) {
        // Remove from local state
        setCampaigns(prev => prev.filter(campaign => campaign.id !== selectedCampaignId));
        setDeleteOpen(false);
        setSelectedCampaignId('');
        setSelectedCampaignName('');
      } else {
        console.error('Error deleting campaign:', result.error);
        alert('Error deleting campaign: ' + result.error);
      }
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error deleting campaign: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setDeleting(false);
    }
  };

  const openCampaignDetails = (campaignId: string, campaignName: string) => {
    setSelectedCampaignId(campaignId);
    setSelectedCampaignName(campaignName);
    setDetailsOpen(true);
  };

  const handleExportAllCampaigns = async () => {
    setExporting(true);
    try {
      const result = await exportAllCampaignsData();
      if (result.success && result.calls && result.stats) {
        exportAllCampaignDataToExcel(result.calls, result.stats, 'All_Campaigns');
      } else {
        console.error('Error exporting campaigns:', result.error);
        alert('Error exporting campaigns: ' + result.error);
      }
    } catch (error) {
      console.error('Error exporting campaigns:', error);
      alert('Error exporting campaigns: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setExporting(false);
    }
  };

  const getStatusBadge = (executionStatus: Campaign['execution_status']) => {
    const variants = {
      idle: { className: 'bg-muted text-muted-foreground border-border' },
      running: { className: 'bg-green-500/10 text-green-500 border-green-500/20' },
      paused: { className: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
      completed: { className: 'bg-blue-500/10 text-blue-500 border-blue-500/20' },
      error: { className: 'bg-destructive/10 text-destructive border-destructive/20' }
    };

    const config = variants[executionStatus] || variants.idle;
    return (
      <Badge variant="outline" className={`text-xs px-2 py-1 border ${config.className}`}>
        {executionStatus.charAt(0).toUpperCase() + executionStatus.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-primary border-t-transparent mx-auto mb-4"></div>
              <p className="text-foreground">Loading campaigns...</p>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (campaigns.length === 0) {
    return (
      <DashboardLayout>
        <div className="h-screen flex flex-col bg-background">
          <div className="flex-1 flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="text-center max-w-2xl mx-auto px-6"
            >
              <div className="w-20 h-20 mx-auto mb-6 bg-muted/50 rounded-2xl flex items-center justify-center border border-border">
                <BarChart3 className="w-10 h-10 text-primary" />
              </div>
              <h1 className="text-3xl font-semibold text-foreground mb-3">
                Create And Launch Your First Campaign
              </h1>
              <p className="text-lg text-muted-foreground mb-8 leading-relaxed">
                Launch your AI agents and start creating amazing campaigns that will help you connect with your customers in a meaningful way.
              </p>

              <Button
                onClick={handleNewCampaign}
                size="lg"
                className="px-8 py-3 text-lg font-medium"
              >
                Launch a campaign
              </Button>
            </motion.div>
          </div>

          <TermsOfUseDialog
            open={termsOpen}
            onOpenChange={setTermsOpen}
            onAccepted={handleTermsAccepted}
          />

          <CampaignSettingsDialog
            open={settingsOpen}
            onOpenChange={setSettingsOpen}
            onSave={handleCampaignCreated}
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-screen flex flex-col bg-background">
        {/* Top Header Bar */}
        <div className="flex-shrink-0 border-b border-border bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
          <div className="container mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-semibold text-foreground mb-1">
                  Campaigns
                </h1>
                <p className="text-sm text-muted-foreground">
                  {campaigns.length} {campaigns.length === 1 ? 'campaign' : 'campaigns'} • Manage and monitor your AI agent campaigns
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3">
                <Button
                  onClick={handleExportAllCampaigns}
                  variant="outline"
                  disabled={exporting}
                  className="h-9"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {exporting ? 'Exporting...' : 'Export All'}
                </Button>
                <Button
                  onClick={handleNewCampaign}
                  className="h-9"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  New Campaign
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto px-6 py-6">
            <div className="bg-card rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-b border-border hover:bg-transparent">
                      <TableHead className="w-[100px] text-foreground font-semibold text-sm">Status</TableHead>
                      <TableHead className="text-foreground font-semibold text-sm">Name</TableHead>
                      <TableHead className="text-foreground font-semibold text-sm">Daily Cap</TableHead>
                      <TableHead className="text-foreground font-semibold text-sm">Assistant</TableHead>
                      <TableHead className="text-foreground font-semibold text-sm">Contact Source</TableHead>
                      <TableHead className="text-right text-foreground font-semibold text-sm">Dials</TableHead>
                      <TableHead className="text-right text-foreground font-semibold text-sm">Pickups</TableHead>
                      <TableHead className="text-right text-foreground font-semibold text-sm">Do Not Call</TableHead>
                      <TableHead className="text-right text-foreground font-semibold text-sm">Outcomes</TableHead>
                      <TableHead className="text-right text-foreground font-semibold text-sm">Total Usage</TableHead>
                      <TableHead className="text-right text-foreground font-semibold text-sm">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map((campaign) => (
                      <TableRow key={campaign.id} className="border-b border-border hover:bg-accent/50 transition-colors">
                        <TableCell>
                          {getStatusBadge(campaign.execution_status)}
                        </TableCell>
                        <TableCell className="font-medium">
                          <Button
                            variant="link"
                            className="p-0 h-auto font-medium text-left text-foreground hover:text-primary"
                            onClick={() => openCampaignDetails(campaign.id, campaign.name)}
                          >
                            {campaign.name}
                          </Button>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaign.daily_cap}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaign.assistant_name || 'Unknown'}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {campaign.contact_source === 'contact_list'
                            ? (campaign.contact_list_name || 'Unknown List')
                            : (campaign.csv_file_name || 'Unknown CSV')
                          }
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {campaign.dials}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {campaign.pickups}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {campaign.do_not_call}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-col text-xs space-y-1">
                            <span className="text-green-500">I: {campaign.interested}</span>
                            <span className="text-red-500">NI: {campaign.not_interested}</span>
                            <span className="text-orange-500">CB: {campaign.callback}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {campaign.total_usage}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openCampaignDetails(campaign.id, campaign.name)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleCampaignStatus(campaign.id)}
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-accent"
                            >
                              {campaign.execution_status === 'running' ? (
                                <Pause className="w-4 h-4" />
                              ) : (
                                <Play className="w-4 h-4" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteCampaign(campaign.id, campaign.name)}
                              className="h-8 w-8 p-0 text-red-400 hover:text-red-500 hover:bg-red-500/10"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <TermsOfUseDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAccepted={handleTermsAccepted}
      />

      <CampaignSettingsDialog
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        onSave={handleCampaignCreated}
      />

      <CampaignDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        campaignId={selectedCampaignId}
        campaignName={selectedCampaignName}
      />

      <DeleteCampaignDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDeleteCampaign}
        campaignName={selectedCampaignName}
        isRunning={campaigns.find(c => c.id === selectedCampaignId)?.execution_status === 'running'}
        loading={deleting}
      />
    </DashboardLayout>
  );
}