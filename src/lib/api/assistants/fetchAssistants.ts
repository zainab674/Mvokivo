import { getAccessToken } from "@/lib/auth";

export interface Assistant {
  id: string;
  name: string;
  description?: string;
  prompt?: string;
  first_message?: string;
  first_sms?: string;
  sms_prompt?: string;
  whatsapp_credentials_id?: string;
  status: "draft" | "active" | "inactive";
  created_at: string;
  updated_at: string;
}

export interface AssistantsResponse {
  assistants: Assistant[];
  total: number;
}

/**
 * Fetch all assistants for the current user
 */
export const fetchAssistants = async (userId?: string): Promise<AssistantsResponse> => {
  try {
    console.log('Fetching assistants...');

    const token = await getAccessToken();
    if (!token) {
      throw new Error('No authentication token found. Please log in.');
    }

    const headers: Record<string, string> = {
      'Authorization': `Bearer ${token}`
    };

    // Include user ID header if provided (for backwards compatibility)
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const response = await fetch('/api/v1/assistants', {
      headers
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      throw new Error('Failed to fetch assistants');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching assistants:', error);
    throw error;
  }
};
