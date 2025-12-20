import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from "@/lib/api-config";

export interface UpdateContactRequest {
  id: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  list_id?: string;
  status?: 'active' | 'inactive' | 'do-not-call';
  do_not_call?: boolean;
}

export interface UpdateContactResponse {
  success: boolean;
  contact?: {
    id: string;
    first_name: string;
    last_name?: string;
    phone?: string;
    email?: string;
    list_id: string;
    status: 'active' | 'inactive' | 'do-not-call';
    do_not_call: boolean;
    created_at: string;
    updated_at: string;
    user_id: string;
  };
  error?: string;
}

/**
 * Update an existing contact via backend API
 */
export const updateContact = async (data: UpdateContactRequest): Promise<UpdateContactResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const body: any = {};
    if (data.first_name || data.last_name) {
      // Ideally we fetch current name if partial update, but simplified here:
      // If only first name provided, we might lose last name if backend only supports 'name'.
      // Best to join if both exist, otherwise send 'name' as best effort.
      // Actually updates usually provide defined fields.
      if (data.first_name && data.last_name) body.name = `${data.first_name} ${data.last_name}`;
      else if (data.first_name) body.name = data.first_name;
      // Limitations of mapping 2 fields to 1. 
    }
    if (data.phone) body.phone = data.phone;
    if (data.email) body.email = data.email;
    if (data.list_id) body.listId = data.list_id;
    if (data.status) body.status = data.status;
    if (data.do_not_call !== undefined) body.do_not_call = data.do_not_call;

    const response = await fetch(`${BACKEND_URL}/api/v1/contacts/${data.id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to update contact' };
    }

    const result = await response.json();
    return {
      success: true,
      contact: {
        id: result.contact._id || result.contact.id,
        first_name: result.contact.name ? result.contact.name.split(' ')[0] : '',
        last_name: result.contact.name ? result.contact.name.split(' ').slice(1).join(' ') : '',
        phone: result.contact.phone,
        email: result.contact.email,
        list_id: result.contact.list_id,
        status: result.contact.status || 'active',
        do_not_call: result.contact.do_not_call || false,
        created_at: result.contact.created_at,
        updated_at: result.contact.updated_at,
        user_id: result.contact.user_id
      }
    };

  } catch (error) {
    console.error('Error updating contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
