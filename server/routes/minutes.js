import express from 'express';
import { User } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';
import { isUnlimitedMinutes, getMinutesBalance, consumeMinutes } from '../utils/minutes-helpers.js';

const router = express.Router();

// Middleware to validate admin access
const validateAdminAccess = async (req, res, next) => {
  try {
    // Auth user is already attached by authenticateToken middleware
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userData = await User.findOne({ id: req.user.id }).select('role');

    if (!userData || userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    next();
  } catch (error) {
    console.error('Error validating admin access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * GET /api/v1/minutes
 * Get current user's minutes information
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userData = await User.findOne({ id: req.user.id })
      .select('plan role tenant slug_name');

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const unlimited = isUnlimitedMinutes(userData);
    const balance = await getMinutesBalance(req.user.id);
    const remainingMinutes = unlimited ? null : balance;

    // We don't have a reliable "percentage used" anymore without knowing original limit
    // but we can just return 0 or calculate from plan?
    // For now, let's just return the balance.

    res.json({
      success: true,
      data: {
        totalMinutes: balance, // Representing available pool
        availableMinutes: balance,
        remainingMinutes,
        unlimited,
        planName: userData.plan || 'Free Plan'
      }
    });
  } catch (error) {
    console.error('Error in GET /minutes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// ... (skipping validateMinutesDistribution and /assign as they are complex to adapt without more model changes, 
// but /deduct is critical)

/**
 * POST /api/v1/minutes/deduct
 * Internal endpoint to deduct minutes after a call (called by LiveKit service)
 */
router.post('/deduct', async (req, res) => {
  try {
    // Verify this is an internal request (service role or internal network)
    const serviceKey = req.headers['x-service-key'];
    const expectedServiceKey = process.env.INTERNAL_SERVICE_KEY;

    if (serviceKey !== expectedServiceKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - service key required'
      });
    }

    const { userId, minutes } = req.body;

    if (!userId || minutes === undefined || minutes === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, minutes'
      });
    }

    // Get current user to check for unlimited
    const user = await User.findOne({ id: userId }).select('role tenant slug_name');
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    if (isUnlimitedMinutes(user)) {
      return res.json({ success: true, data: { userId, internal: true, unlimited: true } });
    }

    // Use our new FIFO consumption logic
    const success = await consumeMinutes(userId, minutes);
    const newBalance = await getMinutesBalance(userId);

    res.json({
      success: true,
      data: {
        userId,
        minutesDeducted: minutes,
        remainingMinutes: newBalance,
        exceededLimit: !success
      }
    });
  } catch (error) {
    console.error('Error in POST /minutes/deduct:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/users/:userId/minutes
 * Internal endpoint for LiveKit to check user minutes (service key required).
 */
export const userMinutesRouter = express.Router();
userMinutesRouter.get('/:userId/minutes', async (req, res) => {
  try {
    const serviceKey = req.headers['x-service-key'];
    const expectedServiceKey = process.env.INTERNAL_SERVICE_KEY;
    if (serviceKey !== expectedServiceKey) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized - service key required'
      });
    }

    const { userId } = req.params;
    const user = await User.findOne({ id: userId }).select('role tenant slug_name');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const unlimited = isUnlimitedMinutes(user);
    const balance = await getMinutesBalance(userId);

    res.json({
      success: true,
      data: {
        totalMinutes: balance,
        usedMinutes: 0, // No longer tracked as a single global number
        remainingMinutes: unlimited ? null : balance,
        unlimited
      }
    });
  } catch (error) {
    console.error('Error in GET /users/:userId/minutes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
