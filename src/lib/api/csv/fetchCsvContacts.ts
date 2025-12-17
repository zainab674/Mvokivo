import { getAccessToken } from '@/lib/auth';

export interface CsvContact {
  id: string;
  csv_file_id: string;
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  status: 'active' | 'inactive' | 'do-not-call';
  do_not_call: boolean;
  user_id: string;
  created_at: string;
}

export interface CsvContactsResponse {
  contacts: CsvContact[];
  total: number;
}

/**
 * Fetch CSV contacts for a specific CSV file via backend API
 */
export const fetchCsvContacts = async (csvFileId: string): Promise<CsvContactsResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`/api/v1/csv/${csvFileId}/contacts?limit=1000`, { // Default high limit
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch CSV contacts');
    }

    const data = await response.json();
    return {
      contacts: data.contacts.map((c: any) => ({
        ...c,
        id: c._id || c.id,
        phone: c.phone || c.phone_number // Handle both fields if distinct
      })),
      total: data.total
    };

  } catch (error) {
    console.error('Error fetching CSV contacts:', error);
    throw error;
  }
};
