import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from "@/lib/api-config";

export interface Contact {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  list_id: string;
  list_name: string;
  status: 'active' | 'inactive' | 'do-not-call';
  do_not_call: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ContactsResponse {
  contacts: Contact[];
  total: number;
}

/**
 * Fetch contacts from backend API with optional list filtering
 */
export const fetchContacts = async (listId?: string): Promise<ContactsResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    let url = `${BACKEND_URL}/api/v1/contacts?limit=1000`; // Default high limit for now to match UI expectations
    if (listId) {
      url += `&listId=${listId}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch contacts');
    }

    const data = await response.json();
    return {
      contacts: data.contacts.map((c: any) => ({
        ...c,
        list_name: c.list_name || 'Unknown List' // Backend might need to populate this or we handle it
      })),
      total: data.total
    };

  } catch (error) {
    console.error('Error fetching contacts:', error);
    throw error;
  }
};
