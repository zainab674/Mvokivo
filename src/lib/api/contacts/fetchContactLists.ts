import { getAccessToken } from '@/lib/auth';

export interface ContactList {
  id: string;
  name: string;
  count: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ContactListsResponse {
  contactLists: ContactList[];
  total: number;
}

/**
 * Fetch contact lists from backend API
 */
export const fetchContactLists = async (): Promise<ContactListsResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch('/api/v1/contacts/lists', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch contact lists');
    }

    const data = await response.json();

    // Map _id to id if necessary
    const lists = data.lists ? data.lists.map((list: any) => ({
      ...list,
      id: list._id || list.id,
      count: list.count || 0 // Backend currently doesn't count contacts per list in list view, I might need to update backend to agg or just return 0 for now.
    })) : [];

    return {
      contactLists: lists,
      total: lists.length
    };

  } catch (error) {
    console.error('Error fetching contact lists:', error);
    throw error;
  }
};
