import { getAccessToken } from '@/lib/auth';

export interface CreateContactRequest {
  first_name: string;
  last_name?: string;
  phone?: string;
  email?: string;
  list_id: string;
  status?: 'active' | 'inactive' | 'do-not-call';
  do_not_call?: boolean;
  user_id: string;
}

export interface CreateContactResponse {
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
 * Create a new contact via backend API
 */
export const createContact = async (data: CreateContactRequest): Promise<CreateContactResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch('/api/v1/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: data.first_name + (data.last_name ? ` ${data.last_name}` : ''), // Backend expects name currently, or we should update backend
        // My backend expects: name, email, phone, listId.
        // Frontend sends: first_name, last_name separately.
        // Backend `server/routes/contacts.js` line 144: `const { name, email, phone, listId } = req.body;`
        // So I should combine first+last to name for now, or update backend to support first/last.
        // The Mongoose schema snippet I saw had `name: String`.
        // I'll combine it.
        email: data.email,
        phone: data.phone,
        listId: data.list_id, // Map list_id to listId
        status: data.status,
        do_not_call: data.do_not_call
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      return { success: false, error: errorData.message || 'Failed to create contact' };
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
        status: result.contact.status || 'active', // Backend schema default? Or assumes missing is active
        do_not_call: result.contact.do_not_call || false,
        created_at: result.contact.created_at,
        updated_at: result.contact.updated_at,
        user_id: result.contact.user_id
      }
    };

  } catch (error) {
    console.error('Error creating contact:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
