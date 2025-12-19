import { BACKEND_URL } from '@/lib/api-config';

export interface PhoneNumberMapping {
  number: string;
  inbound_assistant_id: string | null;
}

export interface PhoneNumberMappingsResponse {
  mappings: PhoneNumberMapping[];
  total: number;
}

/**
 * Fetch phone number to assistant mappings
 */
export const fetchPhoneNumberMappings = async (userId: string, accessToken: string): Promise<PhoneNumberMappingsResponse> => {
  try {
    if (!userId) {
      throw new Error('User ID is required to fetch mappings');
    }

    if (!accessToken) {
      throw new Error('Access token is required to fetch mappings');
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/twilio/user/mappings`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
        'x-user-id': userId
      }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || 'Failed to fetch phone number mappings');
    }

    const data = await response.json();
    return data;

  } catch (error) {
    console.error('Error fetching phone number mappings:', error);
    throw error;
  }
};
