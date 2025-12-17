import { getAccessToken } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/api-config";

export interface Campaign {
  id: string;
  name: string;
  user_id: string;
  assistant_id?: string;
  assistant_name?: string;
  contact_list_id?: string;
  contact_list_name?: string;
  csv_file_id?: string;
  csv_file_name?: string;
  contact_source: 'contact_list' | 'csv_file';
  daily_cap: number;
  calling_days: string[];
  start_hour: number;
  end_hour: number;
  campaign_prompt: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  execution_status: 'idle' | 'running' | 'paused' | 'completed' | 'error';
  dials: number;
  pickups: number;
  do_not_call: number;
  interested: number;
  not_interested: number;
  callback: number;
  total_usage: number;
  current_daily_calls: number;
  total_calls_made: number;
  total_calls_answered: number;
  last_execution_at: string | null;
  next_call_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CampaignsResponse {
  campaigns: Campaign[];
  total: number;
}

/**
 * Fetch campaigns for the current user
 */
export const fetchCampaigns = async (): Promise<CampaignsResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BACKEND_URL}/api/v1/campaigns`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch campaigns');
    }

    const data = await response.json();
    return {
      campaigns: data.campaigns,
      total: data.total
    };

  } catch (error) {
    console.error('Error fetching campaigns:', error);
    throw error;
  }
};
