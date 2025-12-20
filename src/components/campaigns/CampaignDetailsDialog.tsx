import { useState, useEffect, useCallback, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Play, Pause, Square, RefreshCw, Phone, PhoneCall, PhoneOff, Clock, CheckCircle, XCircle } from "lucide-react";
import { getCampaignStatus, CampaignStatus } from "@/lib/api/campaigns/getCampaignStatus";
import { getCampaignCalls, CampaignCall } from "@/lib/api/campaigns/getCampaignCalls";
import { startCampaign } from "@/lib/api/campaigns/startCampaign";
import { pauseCampaign } from "@/lib/api/campaigns/pauseCampaign";
import { resumeCampaign } from "@/lib/api/campaigns/resumeCampaign";
import { stopCampaign } from "@/lib/api/campaigns/stopCampaign";
import { BACKEND_URL } from "@/lib/api-config";

interface CampaignDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaignId: string;
  campaignName: string;
}

// Deep comparison utility functions
const deepEqual = (obj1: any, obj2: any): boolean => {
  if (obj1 === obj2) return true;
  if (obj1 == null || obj2 == null) return false;
  if (typeof obj1 !== typeof obj2) return false;

  if (typeof obj1 !== 'object') return obj1 === obj2;

  if (Array.isArray(obj1) !== Array.isArray(obj2)) return false;

  if (Array.isArray(obj1)) {
    if (obj1.length !== obj2.length) return false;
    for (let i = 0; i < obj1.length; i++) {
      if (!deepEqual(obj1[i], obj2[i])) return false;
    }
    return true;
  }

  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);

  if (keys1.length !== keys2.length) return false;

  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
  }

  return true;
};

const compareCampaignStatus = (oldStatus: CampaignStatus | null, newStatus: CampaignStatus | null): boolean => {
  if (!oldStatus || !newStatus) return oldStatus === newStatus;

  return deepEqual(oldStatus.campaign, newStatus.campaign) &&
    deepEqual(oldStatus.stats, newStatus.stats) &&
    deepEqual(oldStatus.queueStatus, newStatus.queueStatus);
};

const compareCalls = (oldCalls: CampaignCall[], newCalls: CampaignCall[]): boolean => {
  if (oldCalls.length !== newCalls.length) return false;

  // Create maps for efficient comparison
  const oldCallsMap = new Map(oldCalls.map(call => [call.id, call]));
  const newCallsMap = new Map(newCalls.map(call => [call.id, call]));

  // Check if all calls exist and are equal
  for (const [id, oldCall] of oldCallsMap) {
    const newCall = newCallsMap.get(id);
    if (!newCall || !deepEqual(oldCall, newCall)) return false;
  }

  return true;
};

export function CampaignDetailsDialog({ open, onOpenChange, campaignId, campaignName }: CampaignDetailsDialogProps) {
  const [campaignStatus, setCampaignStatus] = useState<CampaignStatus | null>(null);
  const [calls, setCalls] = useState<CampaignCall[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [assistantPhoneNumber, setAssistantPhoneNumber] = useState<string>('');

  // Refs to store previous data for comparison
  const previousStatusRef = useRef<CampaignStatus | null>(null);
  const previousCallsRef = useRef<CampaignCall[]>([]);
  const lastRefreshTimeRef = useRef<number>(0);

  // Load campaign status only
  const loadCampaignStatus = useCallback(async () => {
    if (!campaignId) return false;

    try {
      const statusResult = await getCampaignStatus(campaignId);

      if (statusResult.success && statusResult.campaign) {
        const newStatus = statusResult.campaign;
        const hasStatusChanged = !compareCampaignStatus(previousStatusRef.current, newStatus);

        if (hasStatusChanged) {
          setCampaignStatus(newStatus);
          previousStatusRef.current = newStatus;

          // Get assistant phone number only if status changed
          if (newStatus.campaign?.assistant_id) {
            try {
              const token = localStorage.getItem('token');
              const response = await fetch(`${BACKEND_URL}/api/v1/assistants/${newStatus.campaign.assistant_id}`, {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              const data = await response.json();
              if (data.success && data.data?.phoneNumber) {
                setAssistantPhoneNumber(data.data.phoneNumber);
              }
            } catch (error) {
              console.error('Error fetching assistant phone number:', error);
            }
          }
        }
        return hasStatusChanged;
      }
      return false;
    } catch (error) {
      console.error('Error loading campaign status:', error);
      return false;
    }
  }, [campaignId]);

  // Load campaign calls only
  const loadCampaignCalls = useCallback(async () => {
    if (!campaignId) return false;

    try {
      const callsResult = await getCampaignCalls({ campaignId, limit: 50 });

      if (callsResult.success && callsResult.calls) {
        const newCalls = callsResult.calls;
        const hasCallsChanged = !compareCalls(previousCallsRef.current, newCalls);

        if (hasCallsChanged) {
          setCalls(newCalls);
          previousCallsRef.current = newCalls;
        }
        return hasCallsChanged;
      }
      return false;
    } catch (error) {
      console.error('Error loading campaign calls:', error);
      return false;
    }
  }, [campaignId]);

  // Load all campaign data (initial load)
  const loadCampaignData = useCallback(async () => {
    if (!campaignId) return;

    setLoading(true);
    try {
      const [statusChanged, callsChanged] = await Promise.all([
        loadCampaignStatus(),
        loadCampaignCalls()
      ]);

      // Only log if there were actual changes
      if (statusChanged || callsChanged) {
        console.log('Campaign data updated:', { statusChanged, callsChanged });
      }
    } catch (error) {
      console.error('Error loading campaign data:', error);
    } finally {
      setLoading(false);
    }
  }, [campaignId, loadCampaignStatus, loadCampaignCalls]);

  // Optimized refresh data - only updates if there are changes
  const refreshData = useCallback(async () => {
    if (!open) return;

    setRefreshing(true);
    try {
      const [statusChanged, callsChanged] = await Promise.all([
        loadCampaignStatus(),
        loadCampaignCalls()
      ]);

      // Only log if there were actual changes
      if (statusChanged || callsChanged) {
        console.log('Campaign data refreshed with changes:', { statusChanged, callsChanged });
      } else {
        console.log('Campaign data refreshed - no changes detected');
      }
    } catch (error) {
      console.error('Error refreshing campaign data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [open, loadCampaignStatus, loadCampaignCalls]);

  // Load data when dialog opens
  useEffect(() => {
    if (open) {
      // Reset refs when dialog opens
      previousStatusRef.current = null;
      previousCallsRef.current = [];
      lastRefreshTimeRef.current = 0;
      loadCampaignData();
    }
  }, [open, campaignId, loadCampaignData]);

  // Optimized auto-refresh every 10 seconds when dialog is open
  useEffect(() => {
    if (!open) return;

    const interval = setInterval(() => {
      const now = Date.now();
      // Only refresh if at least 10 seconds have passed since last refresh
      if (now - lastRefreshTimeRef.current >= 10000) {
        lastRefreshTimeRef.current = now;
        refreshData();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [open, refreshData]);

  const handleStartCampaign = async () => {
    const result = await startCampaign({ campaignId });
    if (result.success) {
      // Force refresh after action since we know status changed
      await loadCampaignStatus();
    }
  };

  const handlePauseCampaign = async () => {
    const result = await pauseCampaign({ campaignId });
    if (result.success) {
      // Force refresh after action since we know status changed
      await loadCampaignStatus();
    }
  };

  const handleResumeCampaign = async () => {
    const result = await resumeCampaign({ campaignId });
    if (result.success) {
      // Force refresh after action since we know status changed
      await loadCampaignStatus();
    }
  };

  const handleStopCampaign = async () => {
    const result = await stopCampaign({ campaignId });
    if (result.success) {
      // Force refresh after action since we know status changed
      await loadCampaignStatus();
    }
  };


  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'queued':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'calling':
        return <PhoneCall className="w-4 h-4 text-blue-500" />;
      case 'answered':
        return <Phone className="w-4 h-4 text-green-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'no_answer':
        return <PhoneOff className="w-4 h-4 text-gray-500" />;
      case 'busy':
        return <PhoneOff className="w-4 h-4 text-orange-500" />;
      case 'do_not_call':
        return <XCircle className="w-4 h-4 text-gray-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getOutcomeBadge = (outcome: string | null) => {
    if (!outcome) return null;

    const variants = {
      interested: { variant: 'default' as const, className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' },
      not_interested: { variant: 'destructive' as const, className: 'bg-red-500/10 text-red-500 hover:bg-red-500/20' },
      callback: { variant: 'secondary' as const, className: 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20' },
      do_not_call: { variant: 'outline' as const, className: 'text-muted-foreground' },
      voicemail: { variant: 'secondary' as const, className: 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' },
      wrong_number: { variant: 'outline' as const, className: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' },
      answered: { variant: 'default' as const, className: 'bg-green-500/10 text-green-500 hover:bg-green-500/20' },
      no_answer: { variant: 'outline' as const, className: 'text-muted-foreground' },
      busy: { variant: 'destructive' as const, className: 'bg-orange-500/10 text-orange-500 hover:bg-orange-500/20' }
    };

    const config = variants[outcome as keyof typeof variants] || variants.do_not_call;
    return (
      <Badge variant={config.variant} className={config.className}>
        {outcome.replace('_', ' ')}
      </Badge>
    );
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleString();
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12:00 AM';
    if (hour < 12) return `${hour}:00 AM`;
    if (hour === 12) return '12:00 PM';
    return `${hour - 12}:00 PM`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">
              {campaignName}
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshData}
                disabled={refreshing}
                title="Refresh data"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              {campaignStatus?.campaign && (
                <div className="flex items-center gap-2">
                  {campaignStatus.campaign.execution_status === 'idle' && (
                    <Button size="sm" onClick={handleStartCampaign}>
                      <Play className="w-4 h-4 mr-2" />
                      Start
                    </Button>
                  )}
                  {campaignStatus.campaign.execution_status === 'running' && (
                    <Button size="sm" variant="outline" onClick={handlePauseCampaign}>
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                  )}
                  {campaignStatus.campaign.execution_status === 'paused' && (
                    <Button size="sm" onClick={handleResumeCampaign}>
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                  )}
                  {(campaignStatus.campaign.execution_status === 'running' ||
                    campaignStatus.campaign.execution_status === 'paused') && (
                      <Button size="sm" variant="destructive" onClick={handleStopCampaign}>
                        <Square className="w-4 h-4 mr-2" />
                        Stop
                      </Button>
                    )}
                </div>
              )}
            </div>
          </div>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin" />
            <span className="ml-2">Loading campaign data...</span>
          </div>
        ) : campaignStatus?.campaign ? (
          <div className="space-y-6">
            {/* Basic Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 border border-border rounded">
                <div className="text-2xl font-bold text-blue-500">
                  {campaignStatus.campaign?.total_calls_made || 0}
                </div>
                <div className="text-sm text-muted-foreground">Total Calls</div>
              </div>
              <div className="text-center p-4 border border-border rounded">
                <div className="text-2xl font-bold text-green-500">
                  {campaignStatus.campaign?.total_calls_answered || 0}
                </div>
                <div className="text-sm text-muted-foreground">Answered</div>
              </div>
              <div className="text-center p-4 border border-border rounded">
                <div className="text-2xl font-bold text-orange-500">
                  {campaignStatus.campaign?.current_daily_calls || 0} / {campaignStatus.campaign?.daily_cap || 0}
                </div>
                <div className="text-sm text-muted-foreground">Today's Progress</div>
              </div>
              <div className="text-center p-4 border border-border rounded">
                <div className="text-2xl font-bold text-purple-500">
                  {(campaignStatus.campaign?.total_calls_made || 0) > 0
                    ? Math.round(((campaignStatus.campaign?.total_calls_answered || 0) / (campaignStatus.campaign?.total_calls_made || 1)) * 100)
                    : 0}%
                </div>
                <div className="text-sm text-muted-foreground">Answer Rate</div>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-4">
              <div>
                <span className="text-sm text-muted-foreground">Status:</span>
                <Badge
                  variant={campaignStatus.campaign?.execution_status === 'running' ? 'default' : 'secondary'}
                  className={`ml-2 ${campaignStatus.campaign?.execution_status === 'running'
                    ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20'
                    : campaignStatus.campaign?.execution_status === 'paused'
                      ? 'bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20'
                      : campaignStatus.campaign?.execution_status === 'completed'
                        ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    }`}
                >
                  {campaignStatus.campaign?.execution_status || 'unknown'}
                </Badge>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Calling From:</span>
                <span className="ml-2 text-sm font-medium text-foreground">
                  {assistantPhoneNumber || 'Not configured'}
                </span>
              </div>
            </div>

            {/* Campaign Script */}
            {campaignStatus.campaign?.campaign_prompt && (
              <div>
                <h3 className="text-lg font-medium mb-2 text-foreground">Campaign Script</h3>
                <div className="bg-muted p-4 rounded border border-border">
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {campaignStatus.campaign.campaign_prompt}
                  </div>
                </div>
              </div>
            )}

            {/* Recent Calls */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-foreground">Recent Calls ({calls.length})</h3>
              <div className="border border-border rounded overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead>Contact</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Outcome</TableHead>
                      <TableHead>Time</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {calls.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                          No calls found
                        </TableCell>
                      </TableRow>
                    ) : (
                      calls.slice(0, 10).map((call) => (
                        <TableRow key={call.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium text-foreground">
                            {call.contact_name || 'Unknown'}
                          </TableCell>
                          <TableCell>
                            <span className="font-mono text-sm text-muted-foreground">{call.phone_number}</span>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {getStatusIcon(call.status)}
                              <span className="text-sm capitalize">{call.status}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {call.call_duration > 0 ? formatDuration(call.call_duration) : '-'}
                          </TableCell>
                          <TableCell>
                            {getOutcomeBadge(call.outcome)}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {call.completed_at ? formatDateTime(call.completed_at) : formatDateTime(call.started_at)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Call Outcomes Summary */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-foreground">Call Outcomes</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 border border-border rounded">
                  <div className="text-xl font-bold text-green-500">{campaignStatus.stats?.interested || 0}</div>
                  <div className="text-sm text-muted-foreground">Interested</div>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <div className="text-xl font-bold text-red-500">{campaignStatus.stats?.notInterested || 0}</div>
                  <div className="text-sm text-muted-foreground">Not Interested</div>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <div className="text-xl font-bold text-yellow-500">{campaignStatus.stats?.callback || 0}</div>
                  <div className="text-sm text-muted-foreground">Callback</div>
                </div>
                <div className="text-center p-3 border border-border rounded">
                  <div className="text-xl font-bold text-muted-foreground">{campaignStatus.stats?.doNotCall || 0}</div>
                  <div className="text-sm text-muted-foreground">Do Not Call</div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <span>Failed to load campaign data</span>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
