import express from 'express';
import mongoose from 'mongoose';
import { PaymentMethod, Invoice, MinutesPurchase, CallHistory, SmsMessage, Assistant, User, PlanConfig, ContactList } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';
import { isUnlimitedMinutes, getMinutesBalance, getNextExpiration } from '../utils/minutes-helpers.js';

const router = express.Router();

/**
 * Get all payment methods for user
 * GET /api/v1/billing/payment-methods
 */
router.get('/payment-methods', authenticateToken, async (req, res) => {
    try {
        const paymentMethods = await PaymentMethod.find({
            user_id: req.user.id,
            is_active: true
        })
            .sort({ is_default: -1, created_at: -1 });

        res.json({
            success: true,
            paymentMethods
        });
    } catch (error) {
        console.error('Error fetching payment methods:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Add a payment method
 * POST /api/v1/billing/payment-methods
 */
router.post('/payment-methods', authenticateToken, async (req, res) => {
    try {
        const {
            stripe_payment_method_id,
            card_brand,
            card_last4,
            card_exp_month,
            card_exp_year,
            is_default
        } = req.body;

        if (!stripe_payment_method_id) {
            return res.status(400).json({ success: false, message: 'Payment method ID is required' });
        }

        // Check if already exists
        const existing = await PaymentMethod.findOne({ id: stripe_payment_method_id });
        if (existing) {
            return res.json({ success: true, paymentMethod: existing, message: 'Payment method already exists' });
        }

        // Create new
        const newMethod = await PaymentMethod.create({
            id: stripe_payment_method_id,
            user_id: req.user.id,
            card_brand,
            card_last4,
            card_exp_month,
            card_exp_year,
            is_default: !!is_default,
            is_active: true,
            created_at: new Date()
        });

        res.json({ success: true, paymentMethod: newMethod });
    } catch (error) {
        console.error('Error adding payment method:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Get invoices and minutes purchases for user
 * GET /api/v1/billing/invoices
 */
router.get('/invoices', authenticateToken, async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;

        // Fetch invoices
        const invoices = await Invoice.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .limit(limit);

        // Fetch minutes purchases
        const purchases = await MinutesPurchase.find({ user_id: req.user.id })
            .sort({ created_at: -1 })
            .limit(limit);

        // Combine and map to common format
        const allInvoices = [
            ...invoices.map(inv => ({
                id: inv.id || inv.invoice_number,
                date: inv.created_at || inv.period_start,
                amount: inv.amount,
                status: inv.status || 'paid',
                type: 'subscription'
            })),
            ...purchases.map(p => ({
                id: `MIN-${p._id.toString().slice(0, 8)}`,
                date: p.created_at,
                amount: p.amount_paid,
                status: p.status === 'completed' ? 'paid' : p.status,
                type: 'minutes'
            }))
        ];

        // Sort combined list
        allInvoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Return capped list
        res.json({
            success: true,
            invoices: allInvoices.slice(0, limit)
        });

    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

/**
 * Get usage statistics for user
 * GET /api/v1/billing/usage
 */
router.get('/usage', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findOne({ id: userId });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // 1. Minutes Balance
        const balance = await getMinutesBalance(userId);
        const unlimited = isUnlimitedMinutes(user);
        const remainingMinutes = unlimited ? null : balance;
        const minutesLimit = unlimited ? 0 : balance;
        const minutesUsed = user.minutes_used || 0;
        const nextExpiration = await getNextExpiration(userId);

        // 2. Assistants — collect both custom id and _id so we match CallHistory (same as call-history route)
        const assistants = await Assistant.find({ user_id: userId }).select('id _id');
        const assistantIds = [];
        assistants.forEach(a => {
            if (a.id) assistantIds.push(String(a.id));
            if (a._id) assistantIds.push(a._id.toString());
        });
        const now = new Date();
        const y = now.getFullYear();
        const m = now.getMonth();
        const firstOfMonth = new Date(y, m, 1);
        // ISO string range for same month (LiveKit may store dates as strings e.g. "2026-02-05T22:40:38.651326")
        const pad = (n) => String(n).padStart(2, '0');
        const monthStartStr = `${y}-${pad(m + 1)}-01`;
        const monthEndStr = m === 11 ? `${y + 1}-01-01` : `${y}-${pad(m + 2)}-01`;
        // Match BSON Date or ISO string for created_at/started_at so we count all web calls
        const thisMonthFilter = {
            $or: [
                { created_at: { $gte: firstOfMonth } },
                { started_at: { $gte: firstOfMonth } },
                { created_at: { $gte: monthStartStr, $lt: monthEndStr } },
                { started_at: { $gte: monthStartStr, $lt: monthEndStr } }
            ]
        };

        // Count calls for this user this month: only where assistant belongs to this user (Assistant.user_id === userId)
        const callHistoryForUser = {
            $and: [
                thisMonthFilter,
                { assistant_id: { $in: assistantIds } }
            ]
        };

        // 3. API Calls (Call History count)
        const apiCallsCount = assistantIds.length > 0
            ? await CallHistory.countDocuments(callHistoryForUser)
            : 0;

        // 4. Phone Minutes (sum of call_duration) — only for assistants that belong to this user
        let phoneMinutesCount = 0;
        if (assistantIds.length > 0) {
            const calls = await CallHistory.find(callHistoryForUser).select('call_duration');
            const totalSeconds = calls.reduce((sum, call) => sum + (call.call_duration || 0), 0);
            phoneMinutesCount = Math.round(totalSeconds / 60);
        }

        // 5. Text Messages
        const textMessagesCount = await SmsMessage.countDocuments({
            $and: [
                { user_id: userId },
                {
                    $or: [
                        { date_created: { $gte: firstOfMonth } },
                        { date_created: { $gte: monthStartStr, $lt: monthEndStr } }
                    ]
                }
            ]
        });

        // 6. Team Members (Stub for now, or count users with same tenant)
        const teamMembersCount = 1;

        // Fetch Plan Config to get full plan details
        let planConfig = null;
        let payAsYouGo = false;

        if (user.plan) {
            // Determine tenant for plan lookup
            const planTenant = user.tenant && user.tenant !== 'main' ? user.tenant : null;

            // Find the plan configuration
            planConfig = await PlanConfig.findOne({
                plan_key: user.plan.toLowerCase(),
                tenant: planTenant,
                is_active: true
            });

            if (planConfig) {
                payAsYouGo = planConfig.pay_as_you_go || false;
            }
        }

        if (!planConfig) {
            // Fallback free plan limits
            planConfig = {
                plan_key: 'free',
                name: 'Free',
                price: 0,
                features: ['2500 api calls', '10 team members'],
                pay_as_you_go: false
            };
        }

        // Extract limits from plan features
        const getLimit = (keyword, defaultVal) => {
            if (!planConfig.features) return defaultVal;
            const feature = planConfig.features.find(f => f.toLowerCase().includes(keyword));
            if (feature) {
                const match = feature.match(/\d+/);
                return match ? parseInt(match[0]) : defaultVal;
            }
            return defaultVal;
        };

        const apiCallsLimit = getLimit('calls', 2500);
        const teamMembersLimit = getLimit('team', 10);
        const textMessagesLimit = 2000;

        // Calculate next billing date (trial_ends_at or monthly from created_at)
        let nextBilling = null;
        if (user.trial_ends_at && new Date(user.trial_ends_at) > new Date()) {
            nextBilling = new Date(user.trial_ends_at).toLocaleDateString();
        } else if (user.created_at) {
            const nextBillingDate = new Date(user.created_at);
            nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
            nextBilling = nextBillingDate.toLocaleDateString();
        }

        const payload = {
            success: true,
            usage: {
                minutesBalance: remainingMinutes,
                minutesUsed: minutesUsed,
                minutesUsedThisMonth: phoneMinutesCount,
                minutesLimit: minutesLimit,
                unlimitedMinutes: unlimited,
                nextExpiration: nextExpiration,
                apiCalls: { used: apiCallsCount, limit: apiCallsLimit },
                textMessages: { used: textMessagesCount, limit: textMessagesLimit },
                teamMembers: { used: teamMembersCount, limit: teamMembersLimit },
                phoneMinutes: { used: phoneMinutesCount, limit: -1 }
            },
            plan: {
                key: planConfig.plan_key || user.plan || 'free',
                name: planConfig.name || user.plan || 'Free',
                price: planConfig.price || 0,
                period: 'month',
                status: user.is_active ? 'active' : 'inactive',
                nextBilling: nextBilling,
                payAsYouGo: payAsYouGo,
                features: planConfig.features || []
            }
        };

        // Debug: ?debug=1 to see why "Used this month" might be 0 (different DB vs LiveKit, or assistant id mismatch)
        if (req.query.debug === '1') {
            const totalCallsThisMonth = await CallHistory.countDocuments(thisMonthFilter);
            const dbName = mongoose.connection?.db?.databaseName || 'unknown';
            payload.debug = {
                assistantIdsCount: assistantIds.length,
                assistantIdsSample: assistantIds.slice(0, 5),
                totalCallsThisMonthInThisDb: totalCallsThisMonth,
                dbName,
                hint: totalCallsThisMonth === 0
                    ? 'Node sees 0 calls this month in this DB. If LiveKit writes elsewhere, set LiveKit MONGODB_DB_NAME to: ' + dbName
                    : 'Calls exist in this DB. If still 0 used, check assistantIds includes your demo assistant id.'
            };
        }

        res.json(payload);

    } catch (error) {
        console.error('Error fetching usage stats:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});


export default router;
