import { getAccessToken } from '@/lib/auth';

export interface CampaignCallExport {
  id: string;
  campaign_name: string;
  contact_name: string;
  phone_number: string;
  status: string;
  outcome: string | null;
  call_duration: number;
  recording_url: string | null;
  transcription: any;
  summary: string | null;
  notes: string | null;
  retry_count: number;
  scheduled_at: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface CampaignStatsExport {
  campaign_name: string;
  execution_status: string;
  daily_cap: number;
  current_daily_calls: number;
  total_calls_made: number;
  total_calls_answered: number;
  answer_rate: number;
  interested_count: number;
  not_interested_count: number;
  callback_count: number;
  do_not_call_count: number;
  voicemail_count: number;
  wrong_number_count: number;
  success_rate: number;
  interest_rate: number;
  created_at: string;
  last_execution_at: string | null;
  next_call_at: string | null;
}

export async function exportCampaignCalls(campaignId: string): Promise<{
  success: boolean;
  calls?: CampaignCallExport[];
  error?: string;
}> {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`/api/v1/campaigns/${campaignId}/export/calls`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to export campaign calls');
    }

    const data = await response.json();
    return { success: true, calls: data.calls };
  } catch (error) {
    console.error('Error exporting campaign calls:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function exportCampaignStats(campaignId: string): Promise<{
  success: boolean;
  stats?: CampaignStatsExport[];
  error?: string;
}> {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`/api/v1/campaigns/${campaignId}/export/stats`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to export campaign stats');
    }

    const data = await response.json();
    return { success: true, stats: data.stats };
  } catch (error) {
    console.error('Error exporting campaign stats:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function exportAllCampaignsData(): Promise<{
  success: boolean;
  calls?: CampaignCallExport[];
  stats?: CampaignStatsExport[];
  error?: string;
}> {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`/api/v1/campaigns/export/all`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to export all campaigns data');
    }

    const data = await response.json();
    return {
      success: true,
      calls: data.calls,
      stats: data.stats
    };
  } catch (error) {
    console.error('Error exporting all campaigns data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
