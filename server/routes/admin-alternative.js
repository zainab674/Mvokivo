
import express from 'express';
import { User } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Middleware to validate admin access
const validateAdminAccess = async (req, res, next) => {
  try {
    // authenticateToken attaches user to req.user
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
 * ALTERNATIVE APPROACH: GET /api/v1/admin/users/all
 * Previously fetched from auth.users first. Now fetches from User model.
 */
router.get('/users/all', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    const { page = 1, limit = 50, search } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { company: new RegExp(search, 'i') }
      ];
    }

    const users = await User.find(query)
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await User.countDocuments(query);
    const totalPages = Math.ceil(total / limitNum);

    // Map to previous format for compatibility
    const formattedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name || null,
      role: user.role,
      is_active: user.is_active,
      company: user.website_name || null, // Best guess mapping
      industry: null,
      created_on: user.created_at,
      updated_at: user.created_at, // Missing updated_at in schema sample, using created_at
      contact: {
        email: user.email,
        phone: user.live_demo_phone_number || null,
        countryCode: null,
      },
      email_confirmed: true,
      last_sign_in: null,
      plan: user.plan,
      onboarding_completed: true,
    }));

    res.json({
      success: true,
      data: formattedUsers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages
      }
    });
  } catch (error) {
    console.error('Error in GET /admin/users/all:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

/**
 * HYBRID APPROACH: GET /api/v1/admin/users/complete
 * Previously merged auth + profile. Now just fetches specific fields from User.
 */
router.get('/users/complete', authenticateToken, validateAdminAccess, async (req, res) => {
  try {
    // Fetch all users (or maybe limit if too many, but originally fetched all profiles)
    // Original code fetched from 'users' table then auth.
    // We will just fetch from User model.
    const users = await User.find().sort({ created_at: -1 }).limit(1000); // Add limit for safety

    const completeUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      name: user.name,
      tenant: user.tenant,
      role: user.role,
      created_on: user.created_at,
      contact: {
        email: user.email,
        phone: user.live_demo_phone_number
      },
      // Add other fields as expected by frontend using this endpoint
      ...user.toObject()
    }));

    res.json({
      success: true,
      data: completeUsers
    });
  } catch (error) {
    console.error('Error in GET /admin/users/complete:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

export default router;
