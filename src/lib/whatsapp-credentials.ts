import { getAccessToken } from "@/lib/auth";

export interface UserWhatsAppCredentials {
  id: string;
  user_id: string;
  whatsapp_number: string;
  whatsapp_key: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface WhatsAppCredentialsInput {
  whatsapp_number: string;
  whatsapp_key: string;
  label: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://backend.vokivo.com' : 'http://localhost:4000');


/**
 * Service for managing user-specific WhatsApp Business credentials
 */
export class WhatsAppCredentialsService {
  /**
   * Get the active WhatsApp credentials for the current user
   */
  static async getActiveCredentials(): Promise<UserWhatsAppCredentials | null> {
    try {
      const token = await getAccessToken();
      if (!token) return null;

      const response = await fetch(`${BACKEND_URL}/api/v1/whatsapp/credentials/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch active credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching WhatsApp credentials:", error);
      return null;
    }
  }

  /**
   * Save new WhatsApp credentials for the current user
   */
  static async saveCredentials(input: WhatsAppCredentialsInput): Promise<UserWhatsAppCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/whatsapp/credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          whatsapp_number: input.whatsapp_number,
          whatsapp_key: input.whatsapp_key,
          label: input.label
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving WhatsApp credentials:", error);
      throw error;
    }
  }

  /**
   * Update existing WhatsApp credentials
   */
  static async updateCredentials(credentialsId: string, input: Partial<WhatsAppCredentialsInput>): Promise<UserWhatsAppCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/whatsapp/credentials/${credentialsId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          whatsapp_number: input.whatsapp_number,
          whatsapp_key: input.whatsapp_key,
          label: input.label
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating WhatsApp credentials:", error);
      throw error;
    }
  }

  /**
   * Delete WhatsApp credentials
   */
  static async deleteCredentials(credentialsId: string): Promise<void> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/whatsapp/credentials/${credentialsId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete credentials');
      }
    } catch (error) {
      console.error("Error deleting WhatsApp credentials:", error);
      throw error;
    }
  }

  /**
   * Get all WhatsApp credentials for the current user
   */
  static async getAllCredentials(): Promise<UserWhatsAppCredentials[]> {
    try {
      const token = await getAccessToken();
      if (!token) return [];

      const response = await fetch(`${BACKEND_URL}/api/v1/whatsapp/credentials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return [];

      return await response.json();
    } catch (error) {
      console.error("Error fetching all WhatsApp credentials:", error);
      return [];
    }
  }

  /**
   * Set specific credentials as active
   */
  static async setActiveCredentials(credentialsId: string): Promise<UserWhatsAppCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/whatsapp/credentials/${credentialsId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to activate credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting active WhatsApp credentials:", error);
      throw error;
    }
  }

  /**
   * Validate WhatsApp credentials format
   */
  static validateCredentials(input: WhatsAppCredentialsInput): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!input.whatsapp_number?.trim()) {
      errors.push("WhatsApp number is required");
    } else if (!/^\+[1-9]\d{1,14}$/.test(input.whatsapp_number.trim())) {
      errors.push("WhatsApp number must be in international format (e.g., +1234567890)");
    }

    if (!input.whatsapp_key?.trim()) {
      errors.push("WhatsApp API key is required");
    }

    if (!input.label?.trim()) {
      errors.push("Label is required");
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
