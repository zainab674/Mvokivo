import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/api-config';

export interface CreateContactListRequest {
  name: string;
  user_id: string;
}

export interface CreateContactListResponse {
  success: boolean;
  contactList?: {
    id: string;
    name: string;
    count: number;
    created_at: string;
    updated_at: string;
    user_id: string;
  };
  error?: string;
}

/**
 * Create a new contact list via backend API
 */
export const createContactList = async (data: CreateContactListRequest): Promise<CreateContactListResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BACKEND_URL}/api/v1/contacts/lists`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ name: data.name })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to create contact list' };
    }

    const result = await response.json();

    return {
      success: true,
      contactList: {
        id: result.list._id || result.list.id,
        name: result.list.name,
        count: 0,
        created_at: result.list.created_at,
        updated_at: result.list.updated_at,
        user_id: result.list.user_id
      }
    };

  } catch (error) {
    console.error('Error creating contact list:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
