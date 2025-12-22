
import express from 'express';
import crypto from 'crypto';
import { User, PlanConfig, Invoice, LemonSqueezyConfig } from '../models/index.js';

const router = express.Router();

/**
 * Handle Lemon Squeezy Webhooks
 * POST /api/v1/webhooks/lemonsqueezy
 */
router.post('/', async (req, res) => {
    try {
        const signature = req.get('X-Signature');

        const lsConfig = await LemonSqueezyConfig.findOne({ tenant: 'main' });
        const secret = lsConfig?.webhook_secret || process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

        // Signature validation
        if (secret && signature) {
            const hmac = crypto.createHmac('sha256', secret);
            // Use rawBody (buffer) for verification to ensure exact match
            // Fallback to stringify if rawBody is missing (though less reliable)
            const bodyToSign = req.rawBody || JSON.stringify(req.body);
            const digest = hmac.update(bodyToSign).digest('hex');

            console.log('Webhook Debug:');
            console.log('- Secret used:', secret ? `${secret.substring(0, 5)}...` : 'None');
            console.log('- Signature received:', signature);
            console.log('- Signature calculated:', digest);
            console.log('- Body source:', req.rawBody ? 'rawBody (Buffer)' : 'JSON.stringify(req.body)');
            if (!req.rawBody) {
                console.warn('WARNING: req.rawBody is missing. Verification may fail due to formatting differences.');
            }

            if (digest !== signature) {
                console.error('Invalid Lemon Squeezy signature');
                return res.status(401).send('Invalid signature');
            }
        }

        const event = req.body;
        const { meta, data } = event;
        const eventName = meta.event_name;
        const customData = meta.custom_data || {};

        console.log(`Received Lemon Squeezy event: ${eventName}`, customData);

        if (eventName === 'order_created' || eventName === 'subscription_created') {
            const userId = customData.user_id;
            // Handle variant_id location difference between orders and subscriptions
            const variantId = data.attributes.variant_id ||
                (data.attributes.first_order_item && data.attributes.first_order_item.variant_id);

            if (!userId) {
                console.warn('No user_id in custom_data for Lemon Squeezy webhook');
                return res.status(200).send('No user_id provided');
            }

            // Find plan by variant_id
            const planConfig = await PlanConfig.findOne({ variant_id: String(variantId) });

            if (!planConfig) {
                console.error(`Plan not found for variant ID: ${variantId}`);
                // Proceed anyway if we can imply something, or just log error?
                // We shouldn't block the webhook response.
            }

            const planKey = planConfig ? planConfig.plan_key : 'unknown';

            // Update user
            const updateData = {
                plan: planKey,
                is_active: true, // Reactivate if was inactive
                subscription_id: data.id,
                minutes_limit: planConfig.minutes || 0 // Assign minutes from plan
            };

            // If we have a 'subscription_id' field or similar in schema, update it. 
            // Currently User schema just has 'plan'.

            await User.findOneAndUpdate({ id: userId }, updateData);
            console.log(`Updated user ${userId} to plan ${planKey}`);

            // Create an invoice record
            const invoiceData = {
                id: `LS-${data.id}`,
                user_id: userId,
                amount: data.attributes.total,
                currency: data.attributes.currency,
                status: data.attributes.status,
                invoice_number: data.attributes.identifier,
                period_start: new Date(data.attributes.created_at),
                created_at: new Date(data.attributes.created_at),
                customer_email: data.attributes.user_email,
                customer_name: data.attributes.user_name
            };

            // Avoid duplicates
            await Invoice.findOneAndUpdate(
                { id: invoiceData.id },
                invoiceData,
                { upsert: true }
            );

        }

        res.status(200).send('Webhook received');

    } catch (error) {
        console.error('Error processing Lemon Squeezy webhook:', error);
        res.status(500).send('Server Error');
    }
});

export default router;
