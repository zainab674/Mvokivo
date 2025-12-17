import { createHash } from 'crypto';

export interface SupportSession {
  id: string;
  admin_user_id: string;
  target_user_id: string;
  reason: string;
  duration_minutes: number;
  scoped_token: string;
  status: 'active' | 'expired' | 'revoked' | 'completed';
  expires_at: string;
  started_at: string;
  ended_at?: string;
  created_at: string;
  updated_at: string;
  admin_user?: {
    name?: string;
    contact?: string;
  };
  target_user?: {
    name?: string;
    contact?: string;
    company?: string;
  };
}

export interface AuditLogEntry {
  id: string;
  session_id?: string;
  admin_user_id: string;
  target_user_id?: string;
  action_type: string;
  resource_type?: string;
  resource_id?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface ScopedTokenInfo {
  is_valid: boolean;
  session_id?: string;
  admin_user_id?: string;
  target_user_id?: string;
  expires_at?: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://backend.vokivo.com' : '');

export class SupportAccessService {
  private static instance: SupportAccessService;

  public static getInstance(): SupportAccessService {
    if (!SupportAccessService.instance) {
      SupportAccessService.instance = new SupportAccessService();
    }
    return SupportAccessService.instance;
  }

  private async getAuthHeader(): Promise<HeadersInit> {
    const token = localStorage.getItem('auth_token');
    return token ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  }

  /**
   * Create a new support access session
   */
  async createSupportSession(
    adminUserId: string,
    targetUserId: string,
    reason: string,
    durationMinutes: number = 30
  ): Promise<{ success: boolean; session?: SupportSession; token?: string; message?: string }> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/support-sessions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ targetUserId, reason, durationMinutes })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || data.message || 'Failed to create support session' };
      }

      return {
        success: true,
        session: data.session,
        token: data.token
      };
    } catch (error) {
      console.error('Error in createSupportSession:', error);
      return { success: false, message: 'An error occurred while creating support session' };
    }
  }

  /**
   * Validate a scoped token
   */
  async validateScopedToken(token: string): Promise<ScopedTokenInfo> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/validate-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        return { is_valid: false };
      }

      const { validation } = data;
      return {
        is_valid: validation.is_valid,
        session_id: validation.session_id,
        admin_user_id: validation.admin_user_id,
        target_user_id: validation.target_user_id,
        expires_at: validation.expires_at,
      };
    } catch (error) {
      console.error('Error in validateScopedToken:', error);
      return { is_valid: false };
    }
  }

  /**
   * End a support session
   */
  async endSupportSession(
    sessionId: string,
    adminUserId: string,
    reason: 'completed' | 'revoked' = 'completed'
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/support-sessions/${sessionId}/end`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason })
      });

      const data = await response.json();

      if (!response.ok) {
        return { success: false, message: data.error || 'Failed to end support session' };
      }

      return { success: true };
    } catch (error) {
      console.error('Error in endSupportSession:', error);
      return { success: false, message: 'An error occurred while ending support session' };
    }
  }

  /**
   * Get active support sessions for an admin
   */
  async getActiveSupportSessions(adminUserId: string): Promise<SupportSession[]> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/support-sessions/active`, {
        headers
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.sessions || [];
    } catch (error) {
      console.error('Error in getActiveSupportSessions:', error);
      return [];
    }
  }

  /**
   * Get support session by ID
   */
  async getSupportSession(sessionId: string): Promise<SupportSession | null> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/support-sessions/${sessionId}`, {
        headers
      });

      if (!response.ok) return null;

      const data = await response.json();
      return data.session || null;
    } catch (error) {
      console.error('Error in getSupportSession:', error);
      return null;
    }
  }

  /**
   * Log an audit event
   */
  async logAuditEvent(params: {
    session_id?: string;
    admin_user_id?: string;
    target_user_id?: string;
    action_type: string;
    resource_type?: string;
    resource_id?: string;
    details?: any;
    ip_address?: string;
    user_agent?: string;
  }): Promise<string | null> {
    console.warn('Client-side audit logging not fully implemented via API yet.');
    return null;
  }

  /**
   * Get audit logs for a session
   */
  async getAuditLogs(sessionId: string): Promise<AuditLogEntry[]> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/support-sessions/${sessionId}/audit-logs`, {
        headers
      });

      if (!response.ok) return [];

      const data = await response.json();
      return data.auditLogs || [];
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      return [];
    }
  }

  /**
   * Clean up expired sessions (can be called periodically, backend handles this now)
   */
  async cleanupExpiredSessions(): Promise<number> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/cleanup-expired`, {
        method: 'POST',
        headers
      });

      if (!response.ok) return 0;
      const data = await response.json();
      return 0;
    } catch (error) {
      console.error('Error in cleanupExpiredSessions:', error);
      return 0;
    }
  }

  /**
   * Get user info for scoped access
   */
  async getUserForScopedAccess(targetUserId: string): Promise<any> {
    try {
      const headers = await this.getAuthHeader();
      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/scoped-user/${targetUserId}`, {
        headers
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data.user;
    } catch (error) {
      console.error('Error in getUserForScopedAccess:', error);
      return null;
    }
  }
}
