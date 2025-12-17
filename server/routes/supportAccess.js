import express from 'express';
import { SupportAccessService } from '../lib/supportAccessService.js';
import { authenticateToken } from '../utils/auth.js';
import { User } from '../models/index.js';

const router = express.Router();
const supportAccessService = SupportAccessService.getInstance();

// Middleware to validate admin access
const validateAdminAccess = async (req, res, next) => {
  try {
    // Re-use authenticateToken logic or call it if we can properly chain it
    // But since authenticateToken is a middleware, let's use it on the route definition
    // and this middleware just checks the role 'admin'
    // Actually, I can compose them.

    // For now, let's look at how authenticateToken sets req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Check if user is admin
    const userData = await User.findOne({ id: req.user.id }).select('role');

    if (!userData || userData.role !== 'admin') {
      console.log('❌ User is not admin. Role:', userData?.role);
      return res.status(403).json({ error: 'Admin access required' });
    }

    console.log('✅ Admin access granted for:', req.user.email);
    req.userId = req.user.id;
    next();
  } catch (error) {
    console.error('❌ Error validating admin access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create support access session
router.post('/support-sessions', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { targetUserId, reason, durationMinutes } = req.body;

    if (!targetUserId || !reason) {
      return res.status(400).json({
        error: 'Missing required fields: targetUserId, reason'
      });
    }

    const result = await supportAccessService.createSupportSession(
      req.userId,
      targetUserId,
      reason,
      durationMinutes || 30
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    // Audit log is handled inside service now

    res.json({
      success: true,
      session: result.session,
      token: result.token,
    });
  } catch (error) {
    console.error('Error creating support session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Validate scoped token
router.post('/validate-token', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const validation = await supportAccessService.validateScopedToken(token);

    if (!validation.is_valid) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    res.json({
      success: true,
      validation,
    });
  } catch (error) {
    console.error('Error validating token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// End support session
router.post('/support-sessions/:sessionId/end', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { reason = 'completed' } = req.body;

    const result = await supportAccessService.endSupportSession(
      sessionId,
      req.userId,
      reason
    );

    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error ending support session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get active support sessions for admin
router.get('/support-sessions/active', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const sessions = await supportAccessService.getActiveSupportSessions(req.userId);
    res.json({ sessions });
  } catch (error) {
    console.error('Error fetching active sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get support session details
router.get('/support-sessions/:sessionId', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await supportAccessService.getSupportSession(sessionId);

    if (!session) {
      return res.status(404).json({ error: 'Support session not found' });
    }

    // Check if admin owns this session
    if (session.admin_user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ session });
  } catch (error) {
    console.error('Error fetching support session:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get audit logs for a session
router.get('/support-sessions/:sessionId/audit-logs', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { sessionId } = req.params;

    // Verify session ownership
    const session = await supportAccessService.getSupportSession(sessionId);
    if (!session || session.admin_user_id !== req.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const auditLogs = await supportAccessService.getAuditLogs(sessionId);
    res.json({ auditLogs });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user data for scoped access
router.get('/scoped-user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.substring(7);

    // Validate scoped token
    const validation = await supportAccessService.validateScopedToken(token);

    if (!validation.is_valid || validation.target_user_id !== userId) {
      return res.status(401).json({ error: 'Invalid or unauthorized token' });
    }

    const userData = await supportAccessService.getUserForScopedAccess(userId);

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Log audit event
    await supportAccessService.logAuditEvent({
      session_id: validation.session_id,
      admin_user_id: validation.admin_user_id,
      target_user_id: userId,
      action_type: 'user_viewed',
      resource_type: 'user',
      resource_id: userId,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
    });

    res.json({ user: userData });
  } catch (error) {
    console.error('Error fetching scoped user data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cleanup expired sessions (admin only)
router.post('/cleanup-expired', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const cleanedCount = await supportAccessService.cleanupExpiredSessions();
    res.json({
      success: true,
      message: `Cleaned up ${cleanedCount} expired sessions`
    });
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
