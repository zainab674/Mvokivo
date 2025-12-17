import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { User } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Middleware to validate admin access
const validateAdminAccess = async (req, res, next) => {
  try {
    // authenticateToken already attached user to req.user
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const userData = await User.findOne({ id: req.user.id }).select('role slug_name tenant');

    if (!userData) {
      return res.status(403).json({ error: 'User not found' });
    }

    if (userData.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.userId = req.user.id;
    req.userRole = userData.role;
    req.userSlug = userData.slug_name;
    req.userTenant = userData.tenant;
    next();
  } catch (error) {
    console.error('Error validating admin access:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Helper function to validate minutes distribution
 * Ensures the sum of all customer minutes doesn't exceed tenant admin's plan minutes
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
    // Find all users belonging to this tenant, excluding limit
    const customers = await User.find({
      tenant: tenantSlug,
      id: { $ne: adminUserId }
    }).select('id minutes_limit');

    // Calculate current total minutes allocated to customers
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
 * GET /api/v1/admin/users/emails
 * Get emails for multiple users
 */
router.get('/users/emails', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { userIds } = req.query;

    if (!userIds) {
      return res.status(400).json({
        success: false,
        error: 'userIds query parameter is required (comma-separated)'
      });
    }

    const userIdArray = Array.isArray(userIds)
      ? userIds
      : userIds.split(',').map(id => id.trim());

    const users = await User.find({ id: { $in: userIdArray } }).select('id email');

    const emailMap = {};
    users.forEach(user => {
      emailMap[user.id] = user.email;
    });

    res.json({
      success: true,
      data: emailMap
    });
  } catch (error) {
    console.error('Error in GET /admin/users/emails:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/admin/users
 * Fetch users with pagination and filtering
 */
router.get('/users', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { page = 1, perPage = 1000, search } = req.query;

    // Determine admin type
    const isMainTenantAdmin = req.userTenant === 'main' && req.userRole === 'admin' && !req.userSlug;
    const isWhitelabelAdmin = req.userRole === 'admin' && req.userSlug;

    // Build query
    const query = {};

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { 'contact.email': searchRegex }, // Assuming contact is stored nested or check schema
        // Schema has email at top level and contact_email
        { contact_email: searchRegex }
      ];
    }

    // Role/Tenant filtering logic
    if (isMainTenantAdmin) {
      // Main tenant admin sees: 
      // 1. Main tenant users (tenant = 'main')
      // 2. Whitelabel admins (slug_name exists)
      // Excludes whitelabel customers (tenant != 'main' AND no slug_name)

      // This logic is a bit complex for a single query.
      // Option 1: tenant: 'main' OR (slug_name: { $exists: true, $ne: null })
      query.$or = [
        { tenant: 'main' },
        { slug_name: { $exists: true, $ne: null } }
      ];
      // If search was also applied, we need to combine with $and
      if (search) {
        // Re-structure slightly
        const searchPart = { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] };
        query.$and = [
          searchPart,
          { $or: [{ tenant: 'main' }, { slug_name: { $exists: true, $ne: null } }] }
        ];
        delete query.$or; // Remove the search specific $or
      }

    } else if (isWhitelabelAdmin) {
      // Whitelabel admin sees:
      // 1. Users belonging to their tenant (tenant = req.userSlug)
      // 2. Themselves (slug_name = req.userSlug) - strictly optional but good for visibility

      query.$or = [
        { tenant: req.userSlug },
        { slug_name: req.userSlug }
      ];

      if (search) {
        const searchPart = { $or: [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }] };
        query.$and = [
          searchPart,
          { $or: [{ tenant: req.userSlug }, { slug_name: req.userSlug }] }
        ];
        delete query.$or;
      }
    } else {
      // Should not happen due to middleware, but fail safe
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Pagination
    const pageNum = parseInt(page);
    const perPageNum = parseInt(perPage);
    const skip = (pageNum - 1) * perPageNum;

    const users = await User.find(query)
      .sort({ created_at: -1 }) // Sort new first
      .skip(skip)
      .limit(perPageNum);

    const total = await User.countDocuments(query);

    // Map to response format
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || user.website_name || null, // Fallback
      role: user.role,
      is_active: user.is_active,
      created_on: user.created_at,
      updated_at: user.created_at, // Use created_at if updated_at specific field missing or assume match
      contact: {
        email: user.email,
        phone: user.live_demo_phone_number || null, // Trying to map what's available
        countryCode: null
      },
      email_confirmed: true, // Assuming true for now
      last_sign_in: null, // Not tracking currently
      plan: user.plan,
      minutes_limit: user.minutes_limit,
      minutes_used: user.minutes_used,
      is_whitelabel: !!user.slug_name,
      slug_name: user.slug_name,
      tenant: user.tenant
    }));

    res.json({
      success: true,
      data: formattedUsers,
      total: total
    });
  } catch (error) {
    console.error('Error in GET /admin/users:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});


/**
 * GET /api/v1/admin/users/:userId
 * Get user details by ID
 */
router.get('/users/:userId', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { userId } = req.params;

    // Whitelabel admin check
    const isWhitelabelAdmin = req.userRole === 'admin' && req.userSlug;

    const query = { id: userId };
    if (isWhitelabelAdmin) {
      query.tenant = req.userSlug;
    }

    const user = await User.findOne(query).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in GET /admin/users/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * PUT /api/v1/admin/users/:userId
 * Update user details by ID
 */
router.put('/users/:userId', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;

    // Filter allowed updates
    const allowedUpdates = ['name', 'email', 'role', 'is_active', 'company', 'industry', 'plan', 'minutes_limit'];
    const filteredUpdates = {};

    Object.keys(updates).forEach(key => {
      if (allowedUpdates.includes(key)) {
        filteredUpdates[key] = updates[key];
      }
    });

    if (Object.keys(filteredUpdates).length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid updates provided'
      });
    }

    // Whitelabel admin check
    const isWhitelabelAdmin = req.userRole === 'admin' && req.userSlug;
    if (isWhitelabelAdmin) {
      // Ensure target user belongs to tenant
      const targetUser = await User.findOne({ id: userId, tenant: req.userSlug });
      if (!targetUser) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
    }

    const user = await User.findOneAndUpdate(
      { id: userId },
      { $set: filteredUpdates },
      { new: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Error in PUT /admin/users/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * DELETE /api/v1/admin/users/:userId
 * Delete a user
 */
router.delete('/users/:userId', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Delete user
    const result = await User.deleteOne({ id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'User deleted successfully'
    });
  } catch (error) {
    console.error('Error in DELETE /admin/users/:userId:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/admin/customers
 * Create a customer for a white label tenant
 */
router.post('/customers', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { name, email, password, phone, countryCode, minutes_limit } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and password are required'
      });
    }

    // Only whitelabel admins can create customers
    const isMainTenantAdmin = req.userTenant === 'main' && req.userRole === 'admin' && !req.userSlug;
    if (isMainTenantAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Main tenant admin cannot create customers directly. Use whitelabel tenant admin account.'
      });
    }

    if (!req.userSlug) {
      return res.status(403).json({
        success: false,
        error: 'Only white label tenant admins can create customers'
      });
    }

    // Validate minutes distribution
    const customerMinutes = minutes_limit || 0;
    if (customerMinutes > 0) {
      const validation = await validateMinutesDistribution(
        req.userSlug,
        req.userId,
        customerMinutes,
        null
      );

      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          details: {
            adminMinutes: validation.adminMinutes,
            currentTotal: validation.currentTotal,
            requested: customerMinutes
          }
        });
      }
    }

    // Check if email already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();

    // Create user
    const newUser = new User({
      id: userId,
      email,
      password: hashedPassword,
      name,
      tenant: req.userSlug,
      role: 'user',
      minutes_limit: minutes_limit || 0,
      minutes_used: 0,
      contact_email: email // Assuming storing contact email
    });

    await newUser.save();

    res.json({
      success: true,
      message: 'Customer created successfully',
      data: {
        id: userId,
        email: email,
        name: name,
        tenant: req.userSlug
      }
    });
  } catch (error) {
    console.error('Error in POST /admin/customers:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * POST /api/v1/admin/customers/:customerId/minutes
 * Distribute minutes to a customer
 */
router.post('/customers/:customerId/minutes', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { customerId } = req.params;
    const { minutes_limit } = req.body;

    if (minutes_limit === undefined || minutes_limit < 0) {
      return res.status(400).json({
        success: false,
        error: 'Valid minutes_limit is required'
      });
    }

    // Only whitelabel admins can distribute minutes
    const isMainTenantAdmin = req.userTenant === 'main' && req.userRole === 'admin' && !req.userSlug;
    if (isMainTenantAdmin) {
      return res.status(403).json({
        success: false,
        error: 'Main tenant admin cannot distribute minutes directly. Use whitelabel tenant admin account.'
      });
    }

    if (!req.userSlug) {
      return res.status(403).json({
        success: false,
        error: 'Only white label tenant admins can distribute minutes'
      });
    }

    // Verify customer belongs to this tenant
    const customer = await User.findOne({
      id: customerId,
      tenant: req.userSlug
    }).select('id minutes_limit');

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: 'Customer not found or does not belong to your tenant'
      });
    }

    // Validate minutes distribution
    const validation = await validateMinutesDistribution(
      req.userSlug,
      req.userId,
      minutes_limit,
      customerId
    );

    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: validation.error,
        details: {
          adminMinutes: validation.adminMinutes,
          currentTotal: validation.currentTotal,
          requested: minutes_limit,
          customerCurrentMinutes: customer.minutes_limit || 0
        }
      });
    }

    // Update customer's minutes
    customer.minutes_limit = minutes_limit;
    await customer.save();

    res.json({
      success: true,
      message: `Minutes updated to ${minutes_limit}`,
      data: {
        customerId,
        minutes_limit
      }
    });
  } catch (error) {
    console.error('Error in POST /admin/customers/:customerId/minutes:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      details: error.message
    });
  }
});

/**
 * GET /api/v1/admin/users/stats
 * Get aggregated usage stats for all users (or filtered users)
 */
router.get('/users/stats', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { userIds } = req.query;

    // Determine admin type
    const isMainTenantAdmin = req.userTenant === 'main' && req.userRole === 'admin' && !req.userSlug;
    const isWhitelabelAdmin = req.userRole === 'admin' && req.userSlug;

    // Build query for users
    const query = {};

    if (userIds) {
      // If specific user IDs are requested
      const userIdArray = Array.isArray(userIds)
        ? userIds
        : userIds.split(',').map(id => id.trim());
      query.id = { $in: userIdArray };
    } else {
      // Apply tenant filtering
      if (isMainTenantAdmin) {
        query.$or = [
          { tenant: 'main' },
          { slug_name: { $exists: true, $ne: null } }
        ];
      } else if (isWhitelabelAdmin) {
        query.$or = [
          { tenant: req.userSlug },
          { slug_name: req.userSlug }
        ];
      } else {
        return res.status(403).json({ error: 'Unauthorized' });
      }
    }

    // Fetch users
    const users = await User.find(query).select('id plan');

    // For now, return basic stats structure
    // In a real implementation, you would aggregate from assistants, calls, messages collections
    const stats = {};

    for (const user of users) {
      stats[user.id] = {
        totalAssistants: 0,
        totalCalls: 0,
        totalHours: 0,
        totalMessages: 0,
        plan: user.plan || null
      };
    }

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /admin/users/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * GET /api/v1/admin/users/:userId/stats
 * Get usage stats for a single user
 */
router.get('/users/:userId/stats', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { userId } = req.params;

    // Whitelabel admin check
    const isWhitelabelAdmin = req.userRole === 'admin' && req.userSlug;

    const query = { id: userId };
    if (isWhitelabelAdmin) {
      query.tenant = req.userSlug;
    }

    const user = await User.findOne(query).select('id plan');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // For now, return basic stats structure
    // In a real implementation, you would aggregate from assistants, calls, messages collections
    const stats = {
      totalAssistants: 0,
      totalCalls: 0,
      totalHours: 0,
      totalMessages: 0,
      plan: user.plan || null
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error in GET /admin/users/:userId/stats:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
