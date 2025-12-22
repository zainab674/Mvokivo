
import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import { PlanConfig, User, LemonSqueezyConfig } from '../models/index.js';

const router = express.Router();

/**
 * Create a Checkout
 * POST /api/v1/checkouts
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const { planKey, variantId } = req.body;
        const userId = req.user.id;

        console.log(`[Checkout] Initiating checkout for user ${userId}, plan ${planKey}, variant ${variantId}`);

        // Get user details first
        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        let targetVariantId = variantId;
        let planTenant = 'main';

        // 1. Resolve Plan and Tenant
        if (planKey) {
            const planConfig = await PlanConfig.findOne({ plan_key: planKey, is_active: true });
            if (!planConfig) {
                console.error(`[Checkout] Plan not found for key: ${planKey}`);
                return res.status(404).json({ error: 'Plan not found' });
            }
            targetVariantId = planConfig.variant_id;
            // Use the plan's tenant to decide who gets paid
            if (planConfig.tenant) {
                planTenant = planConfig.tenant;
            }
        } else {
            // If no planKey (direct variantId), fallback to user's tenant or main
            // This is riskier for whitelabeling, generally we expect planKey.
            // For safety, defaulting to 'main' or the user's assigned tenant if exists.
            planTenant = user.tenant || 'main';
        }

        console.log(`[Checkout] Processing for Tenant: ${planTenant}`);

        // 2. Fetch Config for the specific Tenant
        const lsConfig = await LemonSqueezyConfig.findOne({ tenant: planTenant });

        // STRICT: All tenants (including main) must have keys in the database.
        const apiKey = lsConfig?.api_key;
        const storeId = lsConfig?.store_id;

        if (!apiKey || !storeId) {
            console.error(`[Checkout] Missing Payment Config for tenant: ${planTenant} (DB lookup failed)`);
            return res.status(500).json({ error: `Payment not configured for ${planTenant}` });
        }

        console.log(`[Checkout] Using Store ID: ${storeId} (Tenant: ${planTenant})`);

        if (!targetVariantId) {
            console.error('[Checkout] No Variant ID resolved');
            return res.status(400).json({ error: 'Variant ID required' });
        }

        // Construct checkout payload matching standard JSON:API format
        // Matching structure from proven debug script
        const payload = {
            data: {
                type: 'checkouts',
                attributes: {
                    checkout_data: {
                        email: user.email,
                        name: user.name,
                        custom: {
                            user_id: user.id.toString()
                        }
                    },
                    product_options: {
                        redirect_url: `${process.env.VITE_SITE_URL || 'http://localhost:8080'}/login?payment=success`
                    }
                },
                relationships: {
                    store: {
                        data: {
                            type: 'stores',
                            id: storeId.toString()
                        }
                    },
                    variant: {
                        data: {
                            type: 'variants',
                            id: targetVariantId.toString()
                        }
                    }
                }
            }
        };

        console.log(`[Checkout] FRONTEND_URL env: ${process.env.FRONTEND_URL}`);
        console.log(`[Checkout] Redirect URL set to: ${payload.data.attributes.product_options.redirect_url}`);

        console.log('[Checkout] Sending Payload:', JSON.stringify(payload, null, 2));

        // Call Lemon Squeezy API
        const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
            method: 'POST',
            headers: {
                'Accept': 'application/vnd.api+json',
                'Content-Type': 'application/vnd.api+json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        const responseText = await response.text();
        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error('[Checkout] Failed to parse API response:', responseText);
            return res.status(502).json({ error: 'Invalid response from payment provider' });
        }

        if (!response.ok) {
            console.error('[Checkout] Lemon Squeezy API Error:', JSON.stringify(data, null, 2));
            return res.status(response.status).json({ error: 'Failed to create checkout', details: data });
        }

        const checkoutUrl = data.data?.attributes?.url;
        console.log('[Checkout] Created Checkout URL:', checkoutUrl);

        if (!checkoutUrl) {
            console.error('[Checkout] No checkout URL in response:', JSON.stringify(data));
            return res.status(500).json({ error: 'No checkout URL returned' });
        }

        res.json({ url: checkoutUrl });

    } catch (error) {
        console.error('[Checkout] Exception:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
