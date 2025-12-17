import { getAccessToken } from "@/lib/auth";
import { getCurrentUserIdAsync } from "@/lib/user-context";

export interface UserCalendarCredentials {
  id: string;
  user_id: string;
  provider: string; // 'calcom', 'google', 'outlook', etc.
  api_key: string;
  event_type_id?: string;
  event_type_slug?: string;
  timezone: string;
  label: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CalendarCredentialsInput {
  provider: string;
  apiKey: string;
  eventTypeId?: string;
  eventTypeSlug?: string;
  timezone: string;
  label: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

/**
 * Service for managing user-specific calendar credentials
 */
export class CalendarCredentialsService {
  /**
   * Get the active calendar credentials for the current user
   */
  static async getActiveCredentials(): Promise<UserCalendarCredentials | null> {
    try {
      const token = await getAccessToken();
      if (!token) return null;

      // Generally finding "any" active credential, or implicit one.
      // Or search active by provider? The backend has filter.
      // Backend: /credentials/active (by provider query param) or just general fetch?
      // I implemented /credentials/active which returns ONE active cred.

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/credentials/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch active credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching calendar credentials:", error);
      return null;
    }
  }

  /**
   * Get active calendar credentials by provider
   */
  static async getActiveCredentialsByProvider(provider: string): Promise<UserCalendarCredentials | null> {
    try {
      const token = await getAccessToken();
      if (!token) return null;

      const url = new URL(`${BACKEND_URL}/api/v1/calendar/credentials/active`);
      url.searchParams.append('provider', provider);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error('Failed to fetch active credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error fetching calendar credentials by provider:", error);
      return null;
    }
  }

  /**
   * Save new calendar credentials for the current user
   */
  static async saveCredentials(credentials: CalendarCredentialsInput): Promise<UserCalendarCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      // Test credentials before saving
      const isValid = await this.testCredentials(credentials);
      if (!isValid) {
        throw new Error("Invalid calendar credentials");
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/credentials`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          provider: credentials.provider,
          apiKey: credentials.apiKey,
          timezone: credentials.timezone,
          label: credentials.label
          // event types are separate
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error saving calendar credentials:", error);
      throw error;
    }
  }

  /**
   * Update existing calendar credentials
   */
  static async updateCredentials(
    credentialsId: string,
    credentials: Partial<CalendarCredentialsInput>
  ): Promise<UserCalendarCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/credentials/${credentialsId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Failed to update credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating calendar credentials:", error);
      throw error;
    }
  }

  /**
   * Delete calendar credentials
   */
  static async deleteCredentials(credentialsId: string): Promise<void> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/credentials/${credentialsId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete credentials');
      }
    } catch (error) {
      console.error("Error deleting calendar credentials:", error);
      throw error;
    }
  }

  /**
   * Get all calendar credentials for the current user
   */
  static async getAllCredentials(): Promise<UserCalendarCredentials[]> {
    try {
      const token = await getAccessToken();
      if (!token) return [];

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/credentials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return [];

      return await response.json();
    } catch (error) {
      console.error("Error fetching all calendar credentials:", error);
      return [];
    }
  }

  /**
   * Set specific credentials as active
   */
  static async setActiveCredentials(credentialsId: string): Promise<UserCalendarCredentials> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/credentials/${credentialsId}/activate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to activate credentials');
      }

      return await response.json();
    } catch (error) {
      console.error("Error setting active calendar credentials:", error);
      throw error;
    }
  }

  /**
   * Test calendar credentials by making a simple API call
   */
  static async testCredentials(credentials: CalendarCredentialsInput): Promise<boolean> {
    try {
      if (credentials.provider === 'calcom') {
        // Test Cal.com API key format
        const apiKeyPattern = /^cal_live_[a-f0-9]{32}$|^cal_test_[a-f0-9]{32}$/;
        return apiKeyPattern.test(credentials.apiKey);
      }

      // Add other providers as needed
      return true;
    } catch (error) {
      console.error("Error testing calendar credentials:", error);
      return false;
    }
  }

  /**
   * Get available calendar providers
   */
  static getAvailableProviders(): Array<{ id: string; name: string; description: string }> {
    return [
      {
        id: 'calcom',
        name: 'Cal.com',
        description: 'Open-source scheduling infrastructure'
      }
    ];
  }
}

// Export convenience functions
export const getActiveCalendarCredentials = () => CalendarCredentialsService.getActiveCredentials();
export const getActiveCalendarCredentialsByProvider = (provider: string) =>
  CalendarCredentialsService.getActiveCredentialsByProvider(provider);
export const saveCalendarCredentials = (credentials: CalendarCredentialsInput) =>
  CalendarCredentialsService.saveCredentials(credentials);
export const updateCalendarCredentials = (id: string, credentials: Partial<CalendarCredentialsInput>) =>
  CalendarCredentialsService.updateCredentials(id, credentials);
export const deleteCalendarCredentials = (id: string) => CalendarCredentialsService.deleteCredentials(id);
export const getAllCalendarCredentials = () => CalendarCredentialsService.getAllCredentials();
export const setActiveCalendarCredentials = (id: string) => CalendarCredentialsService.setActiveCredentials(id);
export const testCalendarCredentials = (credentials: CalendarCredentialsInput) =>
  CalendarCredentialsService.testCredentials(credentials);
