
import express from 'express';
import { LemonSqueezyConfig, User } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

// Middleware to validate admin access
const validateAdminAccess = async (req, res, next) => {
    try {
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

        req.userRole = userData.role;
        next();
    } catch (error) {
        console.error('Error validating admin access:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get Lemon Squeezy Config
 * GET /api/v1/admin/lemonsqueezy
 */
router.get('/', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        // Find config for 'main' tenant for now. 
        // If we expand to multi-tenant LS, we'd filter by req.user.slug_name if it exists.
        const config = await LemonSqueezyConfig.findOne({ tenant: 'main' });

        if (!config) {
            // Return empty structure or defaults from env if desired, 
            // but for admin editing, we might want to show what's in DB specifically.
            // Let's return empty strings if not found.
            return res.json({
                success: true,
                data: {
                    api_key: '',
                    store_id: '',
                    webhook_secret: ''
                }
            });
        }

        // Mask API key for security? Usually for editing we need to show it or placeholder.
        // Returning as is for now since only admin can see it.
        res.json({
            success: true,
            data: {
                api_key: config.api_key || '',
                store_id: config.store_id || '',
                webhook_secret: config.webhook_secret || ''
            }
        });

    } catch (error) {
        console.error('Error fetching LS config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Update Lemon Squeezy Config
 * POST /api/v1/admin/lemonsqueezy
 */
router.post('/', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        const { api_key, store_id, webhook_secret } = req.body;

        const updateData = {
            api_key,
            store_id,
            webhook_secret,
            updated_at: new Date()
        };

        const config = await LemonSqueezyConfig.findOneAndUpdate(
            { tenant: 'main' },
            updateData,
            { new: true, upsert: true }
        );

        res.json({ success: true, data: config });

    } catch (error) {
        console.error('Error updating LS config:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
