import express from 'express';
import { User, PlanConfig } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';

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

        // Update user's plan and reset minutes
        const updates = {
            plan: newPlan.toLowerCase(),
            updated_at: new Date()
        };

        // Assign minutes based on new plan configuration
        if (planConfig.minutes !== undefined && planConfig.minutes !== null) {
            updates.minutes_limit = Number(planConfig.minutes);
            console.log(`Assigned ${planConfig.minutes} minutes to user ${userId} for new plan ${newPlan}`);
        } else if (planConfig.pay_as_you_go) {
            // Pay as you go plan - no minutes included
            updates.minutes_limit = 0;
            console.log(`User ${userId} switched to pay-as-you-go plan ${newPlan} - no minutes included`);
        } else {
            // Unlimited or unspecified
            updates.minutes_limit = 0;
            console.log(`User ${userId} switched to plan ${newPlan} with unlimited/unspecified minutes`);
        }

        // Reset minutes_used to 0 when changing plans
        updates.minutes_used = 0;

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
