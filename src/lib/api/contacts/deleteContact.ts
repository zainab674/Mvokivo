import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from "@/lib/api-config";

export interface DeleteContactRequest {
  id: string;
}

export interface DeleteContactResponse {
  success: boolean;
  error?: string;
}

/**
 * Delete a contact via backend API
 */
export const deleteContact = async (data: DeleteContactRequest): Promise<DeleteContactResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BACKEND_URL}/api/v1/contacts/${data.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to delete contact' };
    }

    return { success: true };

  } catch (error) {
    console.error('Error deleting contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
