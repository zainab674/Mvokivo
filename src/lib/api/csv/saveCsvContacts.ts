import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/api-config';

export interface CsvContactData {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'do-not-call';
  do_not_call?: boolean;
}

export interface SaveCsvContactsRequest {
  csvFileId: string;
  contacts: CsvContactData[];
  userId: string;
}

export interface SaveCsvContactsResponse {
  success: boolean;
  savedCount?: number;
  error?: string;
}

/**
 * Save CSV contacts to database via backend API
 */
export const saveCsvContacts = async (data: SaveCsvContactsRequest): Promise<SaveCsvContactsResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BACKEND_URL}/api/v1/csv/${data.csvFileId}/contacts`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contacts: data.contacts
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to save CSV contacts' };
    }

    const result = await response.json();

    return {
      success: true,
      savedCount: result.savedCount
    };

  } catch (error) {
    console.error('Error saving CSV contacts:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
