import express from 'express';
import { User, PlanConfig, MinutesPurchase } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';
import { addMinuteCredit } from '../utils/minutes-helpers.js';

const router = express.Router();

/**
 * Change user's plan
 * POST /api/v1/user/change-plan
 */
router.post('/change-plan', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { newPlan } = req.body;

        if (!newPlan) {
            return res.status(400).json({ success: false, message: 'New plan is required' });
        }

        const user = await User.findOne({ id: userId });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Determine tenant for plan lookup
        const planTenant = user.tenant && user.tenant !== 'main' ? user.tenant : null;

        // Find the new plan configuration
        const planConfig = await PlanConfig.findOne({
            plan_key: newPlan.toLowerCase(),
            tenant: planTenant,
            is_active: true
        });

        if (!planConfig) {
            return res.status(404).json({ success: false, message: 'Plan not found' });
        }

        // Update user's plan
        const updates = {
            plan: newPlan.toLowerCase(),
            updated_at: new Date(),
            minutes_used: 0 // Reset usage counter
        };

        // If plan has minutes, invalidate old active credits and add new ones
        if (planConfig.minutes > 0) {
            // Optional: Invalidate old credits if you want a clean start on plan change
            await MinutesPurchase.updateMany(
                { user_id: userId, status: 'completed', remaining_minutes: { $gt: 0 } },
                { $set: { remaining_minutes: 0 } }
            );

            await addMinuteCredit(userId, planConfig.minutes, {
                payment_method: 'plan_change',
                notes: `Minutes for new plan: ${planConfig.name}`
            });
        }

        const updatedUser = await User.findOneAndUpdate(
            { id: userId },
            { $set: updates },
            { new: true }
        );

        res.json({
            success: true,
            user: updatedUser,
            message: 'Plan changed successfully'
        });

    } catch (error) {
        console.error('Error changing plan:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

export default router;
