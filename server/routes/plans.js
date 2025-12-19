import express from 'express';
import { PlanConfig, User } from '../models/index.js';
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
        req.userSlug = userData.slug_name;
        req.userTenant = userData.tenant;

        next();
    } catch (error) {
        console.error('Error validating admin access:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

/**
 * Get all active plan configs
 * GET /api/v1/plans
 */
router.get('/', async (req, res) => {
    try {
        const { tenant } = req.query;
        let query = { is_active: true };

        if (tenant) {
            query.tenant = tenant;
        } else {
            // For main fetching main plans
            query.tenant = null;
        }

        console.log('Fetching plans with query:', JSON.stringify(query));
        const plans = await PlanConfig.find(query).sort({ display_order: 1 });
        console.log(`Found ${plans.length} plans`);

        const mappedPlans = plans.map(p => ({
            key: p.plan_key,
            name: p.name,
            price: Number(p.price),
            minutes: p.minutes !== undefined && p.minutes !== null ? Number(p.minutes) : undefined,
            payAsYouGo: p.pay_as_you_go ?? false,
            features: p.features || [],
            whitelabelEnabled: p.whitelabel_enabled
        }));

        res.json({
            success: true,
            data: mappedPlans
        });
    } catch (error) {
        console.error('Error fetching plans:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Create a new plan
 * POST /api/v1/plans
 */
router.post('/', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        const { plan_key, name, price, minutes, pay_as_you_go, features, whitelabel_enabled, tenant } = req.body;

        if (!plan_key || !name || price === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Determine tenant: 
        // If whitelabel admin (req.userSlug), they can only create for their tenant.
        // If main admin, they can create for main (tenant=null) OR potentially for others? 
        // For now, simplify: Main Admin -> main plans (tenant=null). WL Admin -> WL plans.

        let targetTenant = null;
        if (req.userSlug) {
            targetTenant = req.userSlug;
        }

        // Check availability
        const existing = await PlanConfig.findOne({ plan_key, tenant: targetTenant });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Plan key already exists' });
        }

        const newPlan = new PlanConfig({
            plan_key,
            name,
            price,
            minutes: minutes !== undefined && minutes !== null ? Number(minutes) : undefined,
            pay_as_you_go: pay_as_you_go ?? false,
            features: features || [],
            whitelabel_enabled: whitelabel_enabled || false,
            tenant: targetTenant,
            is_active: true,
            display_order: 0 // Default
        });

        await newPlan.save();

        res.json({ success: true, data: newPlan });

    } catch (error) {
        console.error('Error creating plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Update a plan
 * PUT /api/v1/plans/:key
 */
router.put('/:key', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        const { key } = req.params;
        const updates = req.body;

        let targetTenant = null;
        if (req.userSlug) {
            targetTenant = req.userSlug;
        }

        const plan = await PlanConfig.findOne({ plan_key: key, tenant: targetTenant });

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        // Apply updates
        if (updates.name) plan.name = updates.name;
        if (updates.price !== undefined) plan.price = updates.price;
        if (updates.minutes !== undefined) plan.minutes = updates.minutes !== null ? Number(updates.minutes) : undefined;
        if (updates.pay_as_you_go !== undefined) plan.pay_as_you_go = updates.pay_as_you_go;
        if (updates.features) plan.features = updates.features;
        if (updates.whitelabel_enabled !== undefined) plan.whitelabel_enabled = updates.whitelabel_enabled;
        if (updates.is_active !== undefined) plan.is_active = updates.is_active;

        await plan.save();

        res.json({ success: true, data: plan });

    } catch (error) {
        console.error('Error updating plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Delete a plan
 * DELETE /api/v1/plans/:key
 */
router.delete('/:key', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        const { key } = req.params;

        let targetTenant = null;
        if (req.userSlug) {
            targetTenant = req.userSlug;
        }

        // Instead of hard delete, maybe soft delete (is_active=false)? 
        // Frontend logic sometimes does delete.
        // Let's soft delete for safety as per other logic.

        const plan = await PlanConfig.findOneAndUpdate(
            { plan_key: key, tenant: targetTenant },
            { is_active: false },
            { new: true }
        );

        if (!plan) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        res.json({ success: true, message: 'Plan deactivated successfully' });

    } catch (error) {
        console.error('Error deleting plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
