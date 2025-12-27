import { User, PlanConfig, Assistant, EmailCampaign, Campaign } from '../models/index.js';

/**
 * Check if a user has reached their plan limit for a specific resource
 * @param {string} userId - The user ID
 * @param {'assistant' | 'email_campaign' | 'call_campaign'} resourceType - The type of resource to check
 * @returns {Promise<{allowed: boolean, message?: string}>}
 */
export async function checkPlanLimit(userId, resourceType) {
    try {
        const user = await User.findOne({ id: userId });
        if (!user) {
            return { allowed: false, message: 'User not found' };
        }

        // If user is a super admin, allow everything
        if (user.role === 'admin' && !user.tenant) {
            return { allowed: true };
        }

        const planKey = user.plan || 'free';

        // Find plan config. First try tenant-specific, then global.
        let plan = await PlanConfig.findOne({ plan_key: planKey, tenant: user.tenant || null });
        if (!plan && user.tenant) {
            plan = await PlanConfig.findOne({ plan_key: planKey, tenant: null });
        }

        // If no plan found, fallback to default limits (can define here or use free plan defaults)
        if (!plan) {
            // If they are on a plan that doesn't exist anymore, maybe they should be restricted to 'free' limits
            plan = await PlanConfig.findOne({ plan_key: 'free', tenant: null });
        }

        // If whitelabel is enabled for this plan, bypass limits
        if (plan && plan.whitelabel_enabled) {
            return { allowed: true };
        }

        let currentCount = 0;
        let limit = 0;
        let resourceName = '';

        if (resourceType === 'assistant') {
            currentCount = await Assistant.countDocuments({ user_id: userId });
            limit = plan?.max_assistants;
            resourceName = 'agents';
        } else if (resourceType === 'email_campaign') {
            currentCount = await EmailCampaign.countDocuments({ userId: userId });
            limit = plan?.max_email_campaigns;
            resourceName = 'email campaigns';
        } else if (resourceType === 'call_campaign') {
            currentCount = await Campaign.countDocuments({ user_id: userId });
            limit = plan?.max_call_campaigns;
            resourceName = 'call campaigns';
        }

        // 0 or null means unlimited
        if (!limit || limit === 0) {
            return { allowed: true };
        }

        if (currentCount >= limit) {
            return {
                allowed: false,
                message: `Plan limit reached. Your current plan allows up to ${limit} ${resourceName}.`
            };
        }

        return { allowed: true };

    } catch (error) {
        console.error('Error checking plan limit:', error);
        // On error, we might want to default to blocked or allowed. 
        // Safer to allow and log but here let's allow to not break UX for random DB blip.
        return { allowed: true };
    }
}
