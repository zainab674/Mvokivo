import { getAccessToken } from "@/lib/auth";
import { BACKEND_URL } from "@/lib/api-config";

export interface SaveCampaignRequest {
  name: string;
  assistantId: string;
  contactSource: 'contact_list' | 'csv_file';
  contactListId?: string;
  csvFileId?: string;
  dailyCap: number;
  callingDays: string[];
  startHour: number;
  endHour: number;
  campaignPrompt: string;
  userId: string;
}

export interface SaveCampaignResponse {
  success: boolean;
  campaignId?: string;
  error?: string;
}

/**
 * Save campaign to database
 */
export const saveCampaign = async (data: SaveCampaignRequest): Promise<SaveCampaignResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BACKEND_URL}/api/v1/campaigns`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || errorData.error || 'Failed to save campaign');
    }

    const result = await response.json();
    return {
      success: true,
      campaignId: result.campaignId
    };

  } catch (error) {
    console.error('Error saving campaign:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
