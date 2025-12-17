import express from 'express';
import { User } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';

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
      .select('minutes_limit minutes_used plan');

    if (!userData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const minutesLimit = userData.minutes_limit || 0;
    const minutesUsed = userData.minutes_used || 0;
    const remainingMinutes = Math.max(0, minutesLimit - minutesUsed);
    const percentageUsed = minutesLimit > 0
      ? Math.round((minutesUsed / minutesLimit) * 100)
      : 0;

    res.json({
      success: true,
      data: {
        totalMinutes: minutesLimit,
        usedMinutes: minutesUsed,
        remainingMinutes,
        percentageUsed,
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

/**
 * Helper function to validate minutes distribution
 * Ensures the sum of all customer minutes doesn't exceed tenant admin's plan minutes
 * @param {string} tenantSlug - Tenant slug (white label admin's slug)
 * @param {string} adminUserId - Tenant admin's user ID
 * @param {number} newMinutes - New minutes to allocate
 * @param {string} customerId - Customer ID (null for new customers)
 * @returns {Promise<{valid: boolean, error?: string, adminMinutes?: number, currentTotal?: number, newTotal?: number}>}
 */
const validateMinutesDistribution = async (tenantSlug, adminUserId, newMinutes, customerId = null) => {
  try {
    // Get tenant admin's minutes_limit
    const adminData = await User.findOne({ id: adminUserId }).select('minutes_limit');

    if (!adminData) {
      return { valid: false, error: 'Tenant admin not found' };
    }

    const adminMinutes = adminData.minutes_limit || 0;

    // If admin has unlimited minutes (0), allow any distribution
    if (adminMinutes === 0) {
      return { valid: true, adminMinutes: 0, currentTotal: 0, newTotal: newMinutes };
    }

    // Prevent setting customer to unlimited (0) unless admin also has unlimited
    if (newMinutes === 0 && adminMinutes > 0) {
      return {
        valid: false,
        error: `Cannot set customer to unlimited minutes. Admin has limited plan (${adminMinutes} minutes). Only admins with unlimited plans can assign unlimited minutes to customers.`
      };
    }

    // Get sum of all customer minutes (excluding the admin)
    // Find customers belonging to tenant and not admin
    const customers = await User.find({
      tenant: tenantSlug,
      id: { $ne: adminUserId }
    }).select('id minutes_limit');

    // Calculate current total minutes allocated to customers
    // Note: customers with minutes_limit = 0 (unlimited) are excluded from the sum
    // as they don't consume from the admin's pool
    const currentTotal = customers.reduce((sum, customer) => {
      // If updating existing customer, exclude their current minutes
      if (customerId && customer.id === customerId) {
        return sum;
      }
      // Only count customers with limited minutes (exclude unlimited/0)
      const customerMinutes = customer.minutes_limit || 0;
      return customerMinutes > 0 ? sum + customerMinutes : sum;
    }, 0);

    // Calculate new total
    const newTotal = currentTotal + newMinutes;

    // Validate: new total cannot exceed admin's minutes
    if (newTotal > adminMinutes) {
      const available = adminMinutes - currentTotal;
      return {
        valid: false,
        error: `Cannot allocate ${newMinutes} minutes. Available: ${available} minutes (Admin has ${adminMinutes} total, ${currentTotal} already allocated)`,
        adminMinutes,
        currentTotal,
        newTotal
      };
    }

    return {
      valid: true,
      adminMinutes,
      currentTotal,
      newTotal
    };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

/**
 * POST /api/v1/minutes/assign
 * Whitelabel admin endpoint to assign minutes to a customer
 * SECURITY: Only whitelabel admins can use this, and it validates against their minutes_limit
 */
router.post('/assign', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { userId, minutes } = req.body;

    if (!userId || minutes === undefined || minutes === null) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: userId, minutes'
      });
    }

    if (typeof minutes !== 'number' || minutes <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Minutes must be a positive number'
      });
    }

    // Get admin's profile to check if they're a whitelabel admin
    const adminProfile = await User.findOne({ id: req.user.id })
      .select('id slug_name tenant role minutes_limit');

    if (!adminProfile) {
      return res.status(404).json({
        success: false,
        error: 'Admin profile not found'
      });
    }

    // SECURITY: Only whitelabel admins can distribute minutes via this endpoint
    const isMainTenantAdmin = adminProfile.tenant === 'main' && adminProfile.role === 'admin' && !adminProfile.slug_name;
    if (isMainTenantAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Main tenant admin cannot distribute minutes directly. Use whitelabel tenant admin account or use /api/v1/admin/customers/:customerId/minutes endpoint.'
      });
    }

    if (!adminProfile.slug_name) {
      return res.status(403).json({
        success: false,
        error: 'Only white label tenant admins can distribute minutes'
      });
    }

    // Check if target user exists and belongs to admin's tenant
    const targetUser = await User.findOne({ id: userId }).select('id role tenant minutes_limit minutes_used');

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        error: 'Target user not found'
      });
    }

    // SECURITY: Verify customer belongs to admin's tenant
    if (targetUser.tenant !== adminProfile.slug_name) {
      return res.status(403).json({
        success: false,
        error: 'Customer does not belong to your tenant'
      });
    }

    // Prevent assigning minutes to admins
    if (targetUser.role === 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Cannot assign minutes to admin users'
      });
    }

    const currentLimit = targetUser.minutes_limit || 0;
    const newLimit = currentLimit + minutes;

    // SECURITY: Validate minutes distribution using the same validation as secure endpoint
    const validation = await validateMinutesDistribution(
      adminProfile.slug_name,
      req.user.id,
      newLimit, // Total minutes after adding
      userId // Existing customer being updated
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        details: {
          adminMinutes: validation.adminMinutes,
          currentTotal: validation.currentTotal,
          requested: newLimit,
          customerCurrentMinutes: currentLimit
        }
      });
    }

    // Update user's minutes limit
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { minutes_limit: newLimit },
      { new: true }
    ).select('minutes_limit minutes_used');

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Failed to assign minutes'
      });
    }

    res.json({
      success: true,
      message: `Successfully assigned ${minutes} minutes to user`,
      data: {
        userId,
        previousLimit: currentLimit,
        newLimit: updatedUser.minutes_limit,
        minutesAdded: minutes,
        minutesUsed: updatedUser.minutes_used || 0,
        remainingMinutes: Math.max(0, updatedUser.minutes_limit - (updatedUser.minutes_used || 0))
      }
    });
  } catch (error) {
    console.error('Error in POST /minutes/assign:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * POST /api/v1/minutes/deduct
 * Internal endpoint to deduct minutes after a call (called by LiveKit service)
 * This should be protected by service role key or internal network
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

    if (typeof minutes !== 'number' || minutes < 0) {
      return res.status(400).json({
        success: false,
        error: 'Minutes must be a non-negative number'
      });
    }

    // Get current minutes
    const currentData = await User.findOne({ id: userId }).select('minutes_limit minutes_used');

    if (!currentData) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const currentUsed = currentData.minutes_used || 0;
    const newUsed = currentUsed + minutes;

    // Update user's minutes used
    const updatedUser = await User.findOneAndUpdate(
      { id: userId },
      { minutes_used: newUsed },
      { new: true }
    ).select('minutes_limit minutes_used');

    if (!updatedUser) {
      return res.status(500).json({
        success: false,
        error: 'Failed to deduct minutes'
      });
    }

    const minutesLimit = updatedUser.minutes_limit || 0;
    const remainingMinutes = Math.max(0, minutesLimit - newUsed);

    // Check if user has exceeded limit and should be deactivated
    const exceededLimit = newUsed > minutesLimit;

    // If exceeded limit, should we automatically deactivate? 
    // The previous logic didn't deactivate, just flagged.
    // If you want to deactivate, add:
    // if (exceededLimit) { await User.findOneAndUpdate({id: userId}, {is_active: false}); }

    res.json({
      success: true,
      data: {
        userId,
        minutesDeducted: minutes,
        previousUsed: currentUsed,
        newUsed,
        minutesLimit,
        remainingMinutes,
        exceededLimit
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

export default router;
