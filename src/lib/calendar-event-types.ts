import { getAccessToken } from "@/lib/auth";
import { createCalComEventType, getCalComEventTypes } from "@/lib/api/calcom";
import { getCurrentUserIdAsync } from "@/lib/user-context";

export interface CalendarEventType {
  id: string;
  calendar_credential_id: string;
  event_type_id: string;
  event_type_slug: string;
  label: string;
  description?: string;
  duration_minutes: number;
  created_at: string;
  updated_at: string;
}

export interface CalendarEventTypeInput {
  calendarCredentialId: string;
  eventTypeSlug: string;
  label: string;
  description?: string;
  durationMinutes: number;
}

export interface CalComEventType {
  id: number;
  title: string;
  slug: string;
  length: number;
  description?: string;
  // ... Simplified type or complete if needed by frontend
  metadata?: any;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://backend.vokivo.com' : 'http://localhost:4000');


/**
 * Service for managing calendar event types
 */
export class CalendarEventTypeService {
  /**
   * Get all event types for a specific calendar credential
   */
  static async getEventTypesByCredential(credentialId: string): Promise<CalendarEventType[]> {
    try {
      const token = await getAccessToken();
      if (!token) return [];

      const url = new URL(`${BACKEND_URL}/api/v1/calendar/event-types`);
      url.searchParams.append('credentialId', credentialId);

      const response = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return [];

      return await response.json();
    } catch (error) {
      console.error("Error fetching calendar event types:", error);
      return [];
    }
  }

  /**
   * Get all event types for the current user
   */
  static async getAllEventTypes(): Promise<CalendarEventType[]> {
    try {
      const token = await getAccessToken();
      if (!token) return [];

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/event-types`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return [];

      return await response.json();
    } catch (error) {
      console.error("Error fetching all calendar event types:", error);
      return [];
    }
  }

  /**
   * Create a new event type
   */
  static async createEventType(eventType: CalendarEventTypeInput): Promise<CalendarEventType> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      // we are now sending to backend which handles simplified storage.
      // If we need logic to talk to Cal.com API, it should ideally be in backend OR we keep it here.
      // The backend route I implemented just saves to DB. 
      // Refactoring `generateEventTypeId` logic:

      // However, typical pattern is backend Proxy.
      // But creating event on Cal.com requires API KEY which we have?
      // Wait we don't have API key on frontend easily (it is in Credential object).
      // Backend route I wrote creates the object in DB.

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/event-types`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(eventType)
      });

      if (!response.ok) {
        throw new Error('Failed to create event type');
      }

      return await response.json();
    } catch (error) {
      console.error("Error creating calendar event type:", error);
      throw error;
    }
  }

  /**
   * Update an existing event type
   */
  static async updateEventType(
    eventTypeId: string,
    updates: Partial<CalendarEventTypeInput>
  ): Promise<CalendarEventType> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/event-types/${eventTypeId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) {
        throw new Error('Failed to update event type');
      }

      return await response.json();
    } catch (error) {
      console.error("Error updating calendar event type:", error);
      throw error;
    }
  }

  /**
   * Delete an event type
   */
  static async deleteEventType(eventTypeId: string): Promise<void> {
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("User not authenticated");

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/event-types/${eventTypeId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete event type');
      }
    } catch (error) {
      console.error("Error deleting calendar event type:", error);
      throw error;
    }
  }

  /**
   * Generate event type ID by calling Cal.com API
   * @deprecated logic moved to backend or handled externally
   */
  private static async generateEventTypeId(apiKey: string, eventTypeSlug: string, label: string, description?: string, durationMinutes: number = 30): Promise<string> {
    // Stub or move to backend if strictly required. 
    // Since we are using backend /event-types POST which generates ID, we don't need this on frontend.
    return '';
  }

  /**
   * Get event types grouped by calendar credential
   */
  static async getEventTypesGroupedByCredential(): Promise<Record<string, CalendarEventType[]>> {
    try {
      const eventTypes = await this.getAllEventTypes();

      return eventTypes.reduce((acc, eventType) => {
        const credentialId = eventType.calendar_credential_id;
        if (!acc[credentialId]) {
          acc[credentialId] = [];
        }
        acc[credentialId].push(eventType);
        return acc;
      }, {} as Record<string, CalendarEventType[]>);
    } catch (error) {
      console.error("Error grouping event types by credential:", error);
      return {};
    }
  }

  /**
   * Fetch event types directly from Cal.com for a specific calendar credential
   */
  static async fetchEventTypesFromCalCom(calendarCredentialId: string): Promise<CalComEventType[]> {
    try {
      const token = await getAccessToken();
      if (!token) return [];

      // We need to get the API Key for this credential to call Cal.com.
      // We can't easily get the decrypted key on frontend if we secure it.
      // Option 1: Fetch credential (full) -> use key -> call Cal.com (Frontend -> Cal.com).
      // Option 2: Proxy via Backend (Frontend -> Backend -> Cal.com).

      // Let's implement Option 1 for simplest migration IF we can get the key.
      // But `getActiveCredentials` returns everything including api_key.

      // Fetch credential details
      // We need a way to get specific credential by ID. 
      // I didn't explicitly implement GET /credentials/:id in backend but GET /credentials returns list.
      // We can use that.

      const response = await fetch(`${BACKEND_URL}/api/v1/calendar/credentials`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) return [];

      const credentials = await response.json();
      const credential = credentials.find((c: any) => c.id === calendarCredentialId);

      if (!credential || !credential.api_key) return [];

      // Fetch event types from Cal.com using the helper, passing the key
      const eventTypes = await getCalComEventTypes(credential.api_key);
      return eventTypes;

    } catch (error) {
      console.error("Error fetching event types from Cal.com:", error);
      throw error;
    }
  }
}

// Export convenience functions
export const getEventTypesByCredential = (credentialId: string) =>
  CalendarEventTypeService.getEventTypesByCredential(credentialId);
export const getAllEventTypes = () => CalendarEventTypeService.getAllEventTypes();
export const createEventType = (eventType: CalendarEventTypeInput) =>
  CalendarEventTypeService.createEventType(eventType);
export const updateEventType = (id: string, updates: Partial<CalendarEventTypeInput>) =>
  CalendarEventTypeService.updateEventType(id, updates);
export const deleteEventType = (id: string) => CalendarEventTypeService.deleteEventType(id);
export const getEventTypesGroupedByCredential = () =>
  CalendarEventTypeService.getEventTypesGroupedByCredential();
export const fetchEventTypesFromCalCom = (calendarCredentialId: string) =>
  CalendarEventTypeService.fetchEventTypesFromCalCom(calendarCredentialId);
