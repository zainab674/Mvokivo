import { getAccessToken } from "@/lib/auth";

export interface AssignPhoneNumberRequest {
  assistantId: string;
  phoneNumber: string;
  label?: string;
}

export interface AssignPhoneNumberResponse {
  success: boolean;
  message?: string;
  error?: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://backend.vokivo.com' : 'http://localhost:4000');


/**
 * Assign a phone number to an assistant for outbound calls
 */
export const assignPhoneNumber = async (data: AssignPhoneNumberRequest): Promise<AssignPhoneNumberResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) {
      return { success: false, error: 'User not authenticated' };
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/twilio/user/phone-numbers/assign`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: data.phoneNumber,
        assistantId: data.assistantId,
        label: data.label
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return {
        success: false,
        error: result.message || 'Failed to assign phone number'
      };
    }

    return {
      success: true,
      message: 'Phone number assigned successfully'
    };

  } catch (error) {
    console.error('Error assigning phone number:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
