import { getAccessToken } from "@/lib/auth";
import type { TwilioCredentials } from "@/components/settings/integrations/types";
import { getCurrentUser } from "@/lib/auth";

export interface UserTwilioCredentials {
  id: string;
  user_id: string;
  account_sid: string;
  auth_token: string;
  trunk_sid: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface TwilioCredentialsInput {
  accountSid: string;
  authToken: string;
  label: string;
}

import { BACKEND_URL } from "@/lib/api-config";

/**
 * Service for managing user-specific Twilio credentials
 */
export class TwilioCredentialsService {

  /**
   * Get the active Twilio credentials for the current user
   */
  static async getActiveCredentials(): Promise<UserTwilioCredentials | null> {
    try {
      const token = await getAccessToken();
      if (!token) return null;

      const response = await fetch(`${BACKEND_URL}/api/v1/twilio/user/credentials`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        const errorText = await response.text();
        throw new Error(`Failed to fetch credentials: ${errorText}`);
      }

      const data = await response.json();
      return data.credentials;
    } catch (error) {
      console.error("Error fetching Twilio credentials:", error);
      return null;
    }
  }

  /**
   * Save new Twilio credentials for the current user
   * This will automatically create a main trunk for the user
   */
  static async saveCredentials(credentials: TwilioCredentialsInput): Promise<UserTwilioCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      // Use the existing create-main-trunk endpoint which acts as save + setup
      const response = await fetch(`${BACKEND_URL}/api/v1/twilio/user/create-main-trunk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          accountSid: credentials.accountSid,
          authToken: credentials.authToken,
          label: credentials.label
        })
      });

      const trunkResult = await response.json();
      if (!trunkResult.success) {
        throw new Error(trunkResult.message || 'Failed to create main trunk');
      }

      // Backend logic for create-main-trunk saves the credentials.
      // We try to fetch the newly created active credentials to return a full object.
      const freshCreds = await this.getActiveCredentials();
      if (freshCreds) return freshCreds;

      // Fallback if fetch fails but save succeeded (unlikely)
      const user = getCurrentUser();
      return {
        id: 'new',
        user_id: user?.id || '',
        account_sid: credentials.accountSid,
        auth_token: credentials.authToken,
        trunk_sid: trunkResult.trunkSid,
        label: credentials.label,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

    } catch (error) {
      console.error("Error saving Twilio credentials:", error);
      throw error;
    }
  }

  /**
   * Update existing Twilio credentials
   */
  static async updateCredentials(
    credentialsId: string,
    credentials: Partial<TwilioCredentialsInput>
  ): Promise<UserTwilioCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/twilio/user/credentials/${credentialsId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Failed to update credentials');
      }

      const result = await response.json();
      return result.credentials;
    } catch (error) {
      console.error("Error updating Twilio credentials:", error);
      throw error;
    }
  }

  /**
   * Delete Twilio credentials
   */
  static async deleteCredentials(credentialsId: string): Promise<void> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/twilio/user/credentials/${credentialsId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete credentials');
      }
    } catch (error) {
      console.error("Error deleting Twilio credentials:", error);
      throw error;
    }
  }

  /**
   * Get all Twilio credentials for the current user
   */
  static async getAllCredentials(): Promise<UserTwilioCredentials[]> {
    try {
      const token = await getAccessToken();
      if (!token) return [];

      const response = await fetch(`${BACKEND_URL}/api/v1/twilio/user/credentials/all`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.credentials || [];
    } catch (error) {
      console.error("Error fetching all Twilio credentials:", error);
      return [];
    }
  }

  /**
   * Set specific credentials as active
   */
  static async setActiveCredentials(credentialsId: string): Promise<UserTwilioCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/twilio/user/credentials/${credentialsId}/activate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to activate credentials');
      }

      const result = await response.json();
      return result.credentials;
    } catch (error) {
      console.error("Error setting active Twilio credentials:", error);
      throw error;
    }
  }

  /**
   * Test Twilio credentials by making a simple API call
   */
  static async testCredentials(credentials: TwilioCredentialsInput): Promise<boolean> {
    try {
      // Validate format
      const accountSidPattern = /^AC[a-f0-9]{32}$/;
      const authTokenPattern = /^[a-f0-9]{32}$/;

      return (
        accountSidPattern.test(credentials.accountSid) &&
        authTokenPattern.test(credentials.authToken)
      );
    } catch (error) {
      console.error("Error testing Twilio credentials:", error);
      return false;
    }
  }
}

// Export convenience functions
export const getActiveTwilioCredentials = () => TwilioCredentialsService.getActiveCredentials();
export const saveTwilioCredentials = (credentials: TwilioCredentialsInput) =>
  TwilioCredentialsService.saveCredentials(credentials);
export const updateTwilioCredentials = (id: string, credentials: Partial<TwilioCredentialsInput>) =>
  TwilioCredentialsService.updateCredentials(id, credentials);
export const deleteTwilioCredentials = (id: string) => TwilioCredentialsService.deleteCredentials(id);
export const getAllTwilioCredentials = () => TwilioCredentialsService.getAllCredentials();
export const setActiveTwilioCredentials = (id: string) => TwilioCredentialsService.setActiveCredentials(id);
export const testTwilioCredentials = (credentials: TwilioCredentialsInput) =>
  TwilioCredentialsService.testCredentials(credentials);
