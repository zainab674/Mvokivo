import express from 'express';
import { User, MinutesPricingConfig, MinutesPurchase } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';
import { addMinuteCredit, getMinutesBalance } from '../utils/minutes-helpers.js';

const router = express.Router();

// Middleware to validate admin access
const validateAdminAccess = async (req, res, next) => {
    try {
        // Auth user is attached by authenticateToken middleware
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
 * GET /api/v1/admin/minutes-pricing
 * Get minutes pricing configuration (admin only)
 */
router.get('/admin/minutes-pricing', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        // Get admin's tenant
        const adminData = await User.findOne({ id: req.user.id }).select('tenant slug_name');

        if (!adminData) {
            return res.status(404).json({
                success: false,
                error: 'Admin profile not found'
            });
        }

        // Determine tenant (main or whitelabel)
        const tenant = adminData.slug_name || 'main'; // Use slug_name as tenant identifier for pricing

        // Get pricing config for this tenant
        const pricingConfig = await MinutesPricingConfig.findOne({ tenant });

        // If no config exists, return default values
        if (!pricingConfig) {
            return res.json({
                success: true,
                data: {
                    tenant,
                    price_per_minute: 0.01,
                    minimum_purchase: 0,
                    currency: 'USD',
                    is_active: true
                }
            });
        }

        res.json({
            success: true,
            data: pricingConfig
        });
    } catch (error) {
        console.error('Error in GET /admin/minutes-pricing:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * PUT /api/v1/admin/minutes-pricing
 * Update minutes pricing configuration (admin only)
 */
router.put('/admin/minutes-pricing', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        const { price_per_minute, minimum_purchase, currency } = req.body;

        // Validate inputs
        if (price_per_minute !== undefined && (typeof price_per_minute !== 'number' || price_per_minute < 0)) {
            return res.status(400).json({
                success: false,
                error: 'price_per_minute must be a non-negative number'
            });
        }

        if (minimum_purchase !== undefined && (typeof minimum_purchase !== 'number' || minimum_purchase < 0)) {
            return res.status(400).json({
                success: false,
                error: 'minimum_purchase must be a non-negative number'
            });
        }

        // Get admin's tenant
        const adminData = await User.findOne({ id: req.user.id }).select('tenant slug_name');

        if (!adminData) {
            return res.status(404).json({
                success: false,
                error: 'Admin profile not found'
            });
        }

        const tenant = adminData.slug_name || 'main';

        // Prepare update data
        const updateData = {};
        if (price_per_minute !== undefined) updateData.price_per_minute = price_per_minute;
        if (minimum_purchase !== undefined) updateData.minimum_purchase = minimum_purchase;
        if (currency) updateData.currency = currency;
        updateData.is_active = true;

        // Upsert pricing config
        const updatedConfig = await MinutesPricingConfig.findOneAndUpdate(
            { tenant },
            updateData,
            { upsert: true, new: true, setDefaultsOnInsert: true }
        );

        res.json({
            success: true,
            message: 'Pricing configuration updated successfully',
            data: updatedConfig
        });
    } catch (error) {
        console.error('Error in PUT /admin/minutes-pricing:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/v1/minutes-pricing
 * Get current pricing for purchasing minutes
 */
router.get('/minutes-pricing', authenticateToken, async (req, res) => {
    try {
        const userData = await User.findOne({ id: req.user.id }).select('tenant role slug_name');
        if (!userData) {
            return res.status(404).json({ success: false, error: 'User profile not found' });
        }

        const tenant = userData.tenant || 'main';
        const isWhitelabelAdmin = userData.role === 'admin' && userData.slug_name;
        const pricingTenant = isWhitelabelAdmin ? 'main' : tenant;

        const pricingConfig = await MinutesPricingConfig.findOne({ tenant: pricingTenant, is_active: true });
        const pricing = pricingConfig || {
            price_per_minute: 0.01,
            minimum_purchase: 0,
            currency: 'USD'
        };

        res.json({
            success: true,
            data: pricing
        });
    } catch (error) {
        console.error('Error in GET /minutes-pricing:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/v1/minutes/purchase
 */
router.post('/minutes/purchase', authenticateToken, async (req, res) => {
    try {
        const { minutes } = req.body;
        if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
            return res.status(400).json({ success: false, error: 'Valid minutes quantity is required' });
        }

        const userData = await User.findOne({ id: req.user.id }).select('tenant role slug_name');
        if (!userData) {
            return res.status(404).json({ success: false, error: 'User profile not found' });
        }

        const tenant = userData.tenant || 'main';
        const pricingTenant = (userData.role === 'admin' && userData.slug_name) ? 'main' : tenant;
        const pricingConfig = await MinutesPricingConfig.findOne({ tenant: pricingTenant, is_active: true });
        const pricing = pricingConfig || { price_per_minute: 0.01, currency: 'USD' };

        const amount = (minutes * pricing.price_per_minute).toFixed(2);

        // Add minutes as expiring credits
        await addMinuteCredit(req.user.id, minutes, {
            amount_paid: amount,
            currency: pricing.currency,
            payment_method: 'demo',
            notes: 'Minute purchase - 3 month validity'
        });

        const newBalance = await getMinutesBalance(req.user.id);

        res.json({
            success: true,
            message: `Successfully purchased ${minutes} minutes`,
            data: { new_balance: newBalance, valid_for: '3 months' }
        });
    } catch (error) {
        console.error('Error in POST /minutes/purchase:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * GET /api/v1/minutes/purchase-history
 */
router.get('/minutes/purchase-history', authenticateToken, async (req, res) => {
    try {
        const purchases = await MinutesPurchase.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .limit(50);
        res.json({ success: true, data: purchases || [] });
    } catch (error) {
        console.error('Error in GET /minutes/purchase-history:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

/**
 * POST /api/v1/admin/customers/:customerId/add-minutes
 */
router.post('/admin/customers/:customerId/add-minutes', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { minutes, notes } = req.body;

        if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
            return res.status(400).json({ success: false, error: 'Valid minutes quantity is required' });
        }

        const customer = await User.findOne({ id: customerId });
        if (!customer) {
            return res.status(404).json({ success: false, error: 'Customer not found' });
        }

        await addMinuteCredit(customerId, minutes, {
            payment_method: 'manual',
            notes: notes || 'Manually added by admin - 3 month validity'
        });

        const newBalance = await getMinutesBalance(customerId);
        res.json({ success: true, data: { new_balance: newBalance } });
    } catch (error) {
        console.error('Error in POST /admin/customers/:customerId/add-minutes:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

export default router;
