import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/api-config';

export interface BulkCreateContactsRequest {
    contacts: Array<{
        first_name?: string;
        last_name?: string;
        name?: string;
        phone?: string;
        email?: string;
        list_id?: string;
    }>;
    listId?: string;
}

export interface BulkCreateContactsResponse {
    success: boolean;
    message?: string;
    count?: number;
    error?: string;
}

/**
 * Bulk create contacts via backend API
 */
export const bulkCreateContacts = async (data: BulkCreateContactsRequest): Promise<BulkCreateContactsResponse> => {
    try {
        const token = await getAccessToken();
        if (!token) throw new Error('No authentication token found');

        const response = await fetch(`${BACKEND_URL}/api/v1/contacts/bulk`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            const errorData = await response.json();
            return { success: false, error: errorData.message || 'Failed to bulk create contacts' };
        }

        return await response.json();

    } catch (error) {
        console.error('Error bulk creating contacts:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred'
        };
    }
};
