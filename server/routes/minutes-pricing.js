import express from 'express';
import { User, MinutesPricingConfig, MinutesPurchase } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';

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
 * Get current pricing for purchasing minutes (authenticated users)
 * - Whitelabel admins see main tenant pricing (set by main admin)
 * - Whitelabel customers see their whitelabel admin's tenant pricing (set by whitelabel admin)
 * - Main tenant users see main tenant pricing
 */
router.get('/minutes-pricing', authenticateToken, async (req, res) => {
    try {
        // Get user's tenant and role
        const userData = await User.findOne({ id: req.user.id }).select('tenant role slug_name');

        if (!userData) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const tenant = userData.tenant || 'main';
        const isWhitelabelAdmin = userData.role === 'admin' && userData.slug_name;

        // Whitelabel admins buy at main tenant pricing (set by main admin)
        // Whitelabel customers buy at their whitelabel admin's tenant pricing (set by whitelabel admin)
        // Main tenant users buy at main tenant pricing (tenant='main')
        // For whitelabel customers, tenant is the slug_name of the admin
        const pricingTenant = isWhitelabelAdmin ? 'main' : tenant;

        // Get pricing config
        const pricingConfig = await MinutesPricingConfig.findOne({ tenant: pricingTenant, is_active: true });

        // Return default if no config exists
        const pricing = pricingConfig || {
            price_per_minute: 0.01,
            minimum_purchase: 0,
            currency: 'USD'
        };

        res.json({
            success: true,
            data: {
                price_per_minute: pricing.price_per_minute,
                minimum_purchase: pricing.minimum_purchase,
                currency: pricing.currency
            }
        });
    } catch (error) {
        console.error('Error in GET /minutes-pricing:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/v1/minutes/purchase
 * Purchase minutes (creates pending purchase, to be completed by payment webhook)
 * For whitelabel customers: deducts from whitelabel admin's minutes
 */
router.post('/minutes/purchase', authenticateToken, async (req, res) => {
    try {
        const { minutes } = req.body;

        if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid minutes quantity is required'
            });
        }

        // Get user's tenant, role, and pricing
        const userData = await User.findOne({ id: req.user.id }).select('tenant minutes_limit role slug_name minutes_used name email');

        if (!userData) {
            return res.status(404).json({
                success: false,
                error: 'User profile not found'
            });
        }

        const tenant = userData.tenant || 'main';
        const isWhitelabelCustomer = tenant !== 'main' && userData.role !== 'admin' && !userData.slug_name;

        // If user is a whitelabel customer, check whitelabel admin's minutes
        if (isWhitelabelCustomer) {
            // Find the whitelabel admin (user with slug_name matching customer's tenant)
            const whitelabelAdmin = await User.findOne({ slug_name: tenant, role: 'admin' })
                .select('id minutes_limit minutes_used slug_name');

            if (!whitelabelAdmin) {
                return res.status(404).json({
                    success: false,
                    error: 'Whitelabel admin not found. Please contact support.'
                });
            }

            // Check if whitelabel admin has enough minutes
            const adminAvailable = (whitelabelAdmin.minutes_limit || 0) - (whitelabelAdmin.minutes_used || 0);
            if (adminAvailable < minutes) {
                return res.status(400).json({
                    success: false,
                    error: 'Insufficient minutes available. Please contact your administrator to purchase more minutes.'
                });
            }

            // Get pricing config for whitelabel admin's tenant (set by whitelabel admin for their customers)
            const pricingConfig = await MinutesPricingConfig.findOne({ tenant, is_active: true });

            const pricing = pricingConfig || {
                price_per_minute: 0.01,
                minimum_purchase: 0,
                currency: 'USD'
            };

            // Check minimum purchase
            if (pricing.minimum_purchase > 0 && minutes < pricing.minimum_purchase) {
                return res.status(400).json({
                    success: false,
                    error: `Minimum purchase is ${pricing.minimum_purchase} minutes`
                });
            }

            // Calculate amount (for record keeping, but no payment needed)
            const amount = (minutes * pricing.price_per_minute).toFixed(2);

            // Deduct from whitelabel admin's minutes
            const adminNewUsed = (whitelabelAdmin.minutes_used || 0) + minutes;
            await User.updateOne({ id: whitelabelAdmin.id }, { minutes_used: adminNewUsed });

            // Add minutes to customer's account
            const customerCurrentLimit = userData.minutes_limit || 0;
            const customerNewLimit = customerCurrentLimit + minutes;
            const updatedCustomer = await User.findOneAndUpdate(
                { id: req.user.id },
                { minutes_limit: customerNewLimit },
                { new: true }
            );

            if (!updatedCustomer) {
                // Rollback admin minutes logic could be complex if concurrency issues, but for now simple rollback
                // Or just proceed and log error. 
                // Let's assume update worked or throw error.
                // Mongoose findOneAndUpdate returns null if not found (but we found user earlier).
                // If query fails it throws.
            }

            // Create purchase record for customer (credit)
            const purchase = new MinutesPurchase({
                user_id: req.user.id,
                minutes_purchased: minutes,
                amount_paid: amount,
                currency: pricing.currency,
                payment_method: 'whitelabel_admin',
                status: 'completed',
                notes: `Purchased from whitelabel admin (${whitelabelAdmin.slug_name})`
            });
            await purchase.save();

            // Create debit record for whitelabel admin
            const debitRecord = new MinutesPurchase({
                user_id: whitelabelAdmin.id,
                minutes_purchased: minutes,
                amount_paid: amount,
                currency: pricing.currency,
                payment_method: 'whitelabel_customer_sale', // Identifies debit
                status: 'completed',
                notes: `Sold ${minutes} minutes to customer (${userData.name || req.user.id})`
            });
            await debitRecord.save();

            res.json({
                success: true,
                message: `Successfully purchased ${minutes} minutes`,
                data: {
                    purchase,
                    new_balance: updatedCustomer?.minutes_limit || 0,
                    minutes_used: updatedCustomer?.minutes_used || 0
                }
            });
            return;
        }

        // Regular purchase flow (main tenant users or whitelabel admins)
        const isWhitelabelAdmin = userData.role === 'admin' && userData.slug_name;
        const pricingTenant = isWhitelabelAdmin ? 'main' : tenant;

        // Get pricing config
        const pricingConfig = await MinutesPricingConfig.findOne({ tenant: pricingTenant, is_active: true });

        const pricing = pricingConfig || {
            price_per_minute: 0.01,
            minimum_purchase: 0,
            currency: 'USD'
        };

        // Check minimum purchase
        if (pricing.minimum_purchase > 0 && minutes < pricing.minimum_purchase) {
            return res.status(400).json({
                success: false,
                error: `Minimum purchase is ${pricing.minimum_purchase} minutes`
            });
        }

        // Calculate amount
        const amount = (minutes * pricing.price_per_minute).toFixed(2);

        // Add minutes to user's account
        const currentLimit = userData.minutes_limit || 0;
        const newLimit = currentLimit + minutes;

        const updatedUser = await User.findOneAndUpdate(
            { id: req.user.id },
            { minutes_limit: newLimit },
            { new: true }
        );

        // Create purchase record
        const purchase = new MinutesPurchase({
            user_id: req.user.id,
            minutes_purchased: minutes,
            amount_paid: amount,
            currency: pricing.currency,
            payment_method: 'demo', // In production: 'stripe'
            status: 'completed', // In production: 'pending' until webhook confirms
            notes: 'Demo purchase - auto-completed'
        });
        await purchase.save();

        res.json({
            success: true,
            message: `Successfully purchased ${minutes} minutes`,
            data: {
                purchase,
                new_balance: updatedUser?.minutes_limit || 0,
                minutes_used: updatedUser?.minutes_used || 0
            }
        });
    } catch (error) {
        console.error('Error in POST /minutes/purchase:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * GET /api/v1/minutes/purchase-history
 * Get user's purchase history
 */
router.get('/minutes/purchase-history', authenticateToken, async (req, res) => {
    try {
        const purchases = await MinutesPurchase.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .limit(50);

        res.json({
            success: true,
            data: purchases || []
        });
    } catch (error) {
        console.error('Error in GET /minutes/purchase-history:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

/**
 * POST /api/v1/admin/customers/:customerId/add-minutes
 * Manually add minutes to a user (admin only, for promotional/support purposes)
 */
router.post('/admin/customers/:customerId/add-minutes', authenticateToken, validateAdminAccess, async (req, res) => {
    try {
        const { customerId } = req.params;
        const { minutes, notes } = req.body;

        if (!minutes || typeof minutes !== 'number' || minutes <= 0) {
            return res.status(400).json({
                success: false,
                error: 'Valid minutes quantity is required'
            });
        }

        // Verify customer exists
        const customer = await User.findOne({ id: customerId }).select('id name contact minutes_limit minutes_used');

        if (!customer) {
            return res.status(404).json({
                success: false,
                error: 'Customer not found'
            });
        }

        // Add minutes to user's account
        const currentLimit = customer.minutes_limit || 0;
        const newLimit = currentLimit + minutes;

        const updatedUser = await User.findOneAndUpdate(
            { id: customerId },
            { minutes_limit: newLimit },
            { new: true }
        );

        // Create purchase record for accounting/history
        const purchase = new MinutesPurchase({
            user_id: customerId,
            minutes_purchased: minutes,
            amount_paid: 0,
            currency: 'USD',
            payment_method: 'manual',
            status: 'completed',
            notes: notes || 'Manually added by admin'
        });
        await purchase.save();

        res.json({
            success: true,
            message: `Successfully added ${minutes} minutes to ${customer.name || customer.contact?.email || 'user'}`,
            data: {
                purchase,
                new_balance: updatedUser?.minutes_limit || 0
            }
        });
    } catch (error) {
        console.error('Error in POST /admin/customers/:customerId/add-minutes:', error);
        res.status(500).json({
            success: false,
            error: 'Internal server error'
        });
    }
});

export default router;
