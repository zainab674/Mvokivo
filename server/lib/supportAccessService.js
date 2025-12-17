import { User, SupportSession, AuditLog } from '../models/index.js';
import crypto from 'crypto';

export class SupportAccessService {
  static instance = null;

  static getInstance() {
    if (!SupportAccessService.instance) {
      SupportAccessService.instance = new SupportAccessService();
    }
    return SupportAccessService.instance;
  }

  /**
   * Create a new support access session
   */
  async createSupportSession(adminUserId, targetUserId, reason, durationMinutes = 30) {
    try {
      // Validate duration
      if (durationMinutes < 15 || durationMinutes > 120) {
        return { success: false, message: 'Duration must be between 15 and 120 minutes' };
      }

      // Check if admin has permission
      const adminUser = await User.findOne({ id: adminUserId }).select('role');

      if (!adminUser || adminUser.role !== 'admin') {
        return { success: false, message: 'Only admins can create support sessions' };
      }

      // Check if target user exists and is not admin
      const targetUser = await User.findOne({ id: targetUserId }).select('role');

      if (!targetUser) {
        return { success: false, message: 'Target user not found' };
      }

      if (targetUser.role === 'admin') {
        return { success: false, message: 'Cannot create support session for admin users' };
      }

      // Check for existing active session
      const existingSession = await SupportSession.findOne({
        admin_user_id: adminUserId,
        target_user_id: targetUserId,
        status: 'active'
      });

      if (existingSession) {
        // Check if it's actually expired but status says active
        if (existingSession.expires_at > new Date()) {
          return { success: false, message: 'Active support session already exists for this user' };
        } else {
          // It's expired, mark it as expired
          existingSession.status = 'expired';
          await existingSession.save();
        }
      }

      // Calculate expiration time
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + durationMinutes);

      // Generate a secure token
      const tokenData = crypto.randomBytes(32).toString('hex');

      // Create support session
      const session = new SupportSession({
        admin_user_id: adminUserId,
        target_user_id: targetUserId,
        reason,
        duration_minutes: durationMinutes,
        scoped_token: tokenData,
        status: 'active',
        expires_at: expiresAt,
      });

      await session.save();

      // Log audit event
      await this.logAuditEvent({
        session_id: session.id,
        admin_user_id: adminUserId,
        target_user_id: targetUserId,
        action_type: 'support_access_started',
        details: {
          reason,
          duration_minutes: durationMinutes,
          expires_at: expiresAt.toISOString(),
        },
      });

      return {
        success: true,
        session: session,
        token: tokenData,
      };
    } catch (error) {
      console.error('Error in createSupportSession:', error);
      return { success: false, message: 'An error occurred while creating support session' };
    }
  }

  /**
   * Validate a scoped token
   */
  async validateScopedToken(token) {
    try {
      const session = await SupportSession.findOne({ scoped_token: token }).populate('admin_user_id target_user_id'); // Note: populate relies on refs which we haven't strictly defined but fields match

      if (!session) {
        return { is_valid: false };
      }

      // Check if expired
      if (new Date() > session.expires_at) {
        if (session.status === 'active') {
          session.status = 'expired';
          await session.save();
        }
        return { is_valid: false };
      }

      if (session.status !== 'active') {
        return { is_valid: false };
      }

      return {
        is_valid: true,
        session_id: session.id,
        admin_user_id: session.admin_user_id,
        target_user_id: session.target_user_id,
        expires_at: session.expires_at,
      };
    } catch (error) {
      console.error('Error in validateScopedToken:', error);
      return { is_valid: false };
    }
  }

  /**
   * End a support session
   */
  async endSupportSession(sessionId, adminUserId, reason = 'completed') {
    try {
      // Find and update session status
      const session = await SupportSession.findOne({
        id: sessionId, // assuming id field matches or _id
        admin_user_id: adminUserId
      });

      // Fallback for _id if id string search fails or if helper used _id
      let sessionDoc = session;
      if (!sessionDoc) {
        try {
          sessionDoc = await SupportSession.findOne({ _id: sessionId, admin_user_id: adminUserId });
        } catch (e) {
          // invalid object id potentially
        }
      }

      if (!sessionDoc) {
        // Try finding by _id if sessionId is ObjectId
        return { success: false, message: 'Session not found or access denied' };
      }

      sessionDoc.status = reason;
      sessionDoc.ended_at = new Date();
      await sessionDoc.save();

      // Log audit event
      await this.logAuditEvent({
        session_id: sessionId,
        admin_user_id: adminUserId,
        action_type: reason === 'completed' ? 'support_access_ended' : 'support_access_revoked',
      });

      return { success: true };
    } catch (error) {
      console.error('Error in endSupportSession:', error);
      return { success: false, message: 'An error occurred while ending support session' };
    }
  }

  /**
   * Get active support sessions for an admin
   */
  async getActiveSupportSessions(adminUserId) {
    try {
      const sessions = await SupportSession.find({
        admin_user_id: adminUserId,
        status: 'active'
      }).sort({ created_at: -1 });

      // Enrich with user info (manual population since refs are string IDs)
      const enrichedSessions = await Promise.all(sessions.map(async (session) => {
        const admin = await User.findOne({ id: session.admin_user_id }).select('name email'); // contact -> email?
        const target = await User.findOne({ id: session.target_user_id }).select('name email tenant');

        return {
          ...session.toObject(),
          admin_user: admin ? { name: admin.name, contact: admin.email } : null,
          target_user: target ? { name: target.name, contact: target.email, company: target.tenant } : null
        };
      }));

      return enrichedSessions;
    } catch (error) {
      console.error('Error in getActiveSupportSessions:', error);
      return [];
    }
  }

  /**
   * Get support session by ID
   */
  async getSupportSession(sessionId) {
    try {
      let session = null;
      try {
        session = await SupportSession.findById(sessionId);
      } catch (e) {
        // Maybe it's not an ObjectId, check if we used a string id in migration (unlikely for new ones)
      }

      if (!session) return null;

      return session;
    } catch (error) {
      console.error('Error in getSupportSession:', error);
      return null;
    }
  }

  /**
   * Log an audit event
   */
  async logAuditEvent(params) {
    try {
      const auditLog = new AuditLog({
        session_id: params.session_id,
        admin_user_id: params.admin_user_id,
        target_user_id: params.target_user_id,
        action_type: params.action_type,
        resource_type: params.resource_type,
        resource_id: params.resource_id,
        details: params.details,
        ip_address: params.ip_address,
        user_agent: params.user_agent
      });

      await auditLog.save();
      return auditLog;
    } catch (error) {
      console.error('Error in logAuditEvent:', error);
      return null;
    }
  }

  /**
   * Get audit logs for a session
   */
  async getAuditLogs(sessionId) {
    try {
      const logs = await AuditLog.find({ session_id: sessionId }).sort({ created_at: -1 });
      return logs;
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      return [];
    }
  }

  /**
   * Clean up expired sessions (can be called periodically)
   */
  async cleanupExpiredSessions() {
    try {
      const result = await SupportSession.updateMany(
        {
          status: 'active',
          expires_at: { $lt: new Date() }
        },
        {
          status: 'expired'
        }
      );

      return result.modifiedCount || 0;
    } catch (error) {
      console.error('Error in cleanupExpiredSessions:', error);
      return 0;
    }
  }

  /**
   * Get user info for scoped access
   */
  async getUserForScopedAccess(targetUserId) {
    try {
      const user = await User.findOne({ id: targetUserId });
      return user;
    } catch (error) {
      console.error('Error in getUserForScopedAccess:', error);
      return null;
    }
  }
}
