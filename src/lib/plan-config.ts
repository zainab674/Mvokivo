/**
 * Plan Configuration
 * Fetches from database to determine features and whitelabel status
 */

import { extractTenantFromHostname } from './tenant-utils';

export interface PlanConfig {
    key: string;
    name: string;
    price: number | string;
    minutes?: number;
    extraMinutePrice?: number | string;
    agents?: number | string;
    features: string[];
    whitelabelEnabled?: boolean;
    variantId?: string;
    description?: string;
    target?: string;
    maxAssistants?: number;
    maxEmailCampaigns?: number;
    maxCallCampaigns?: number;
    payAsYouGo?: boolean;
}

// Minimal fallback plans
export const DEFAULT_PLAN_CONFIGS: Record<string, PlanConfig> = {
    free: {
        key: "free",
        name: "Free Plan",
        price: 0,
        minutes: 15,
        agents: 1,
        features: [
            "✅ 15 voice minutes free",
            "1 AI voice agent",
            "1 Email campaign",
            "1 Call campaign",
            "Standard voices",
            "Basic conversational workflow",
            "No credit card required"
        ],
        description: "Try & test users",
        target: "Try & test users",
        whitelabelEnabled: false,
        maxAssistants: 1,
        maxEmailCampaigns: 1,
        maxCallCampaigns: 1
    },
    starter: {
        key: "starter",
        name: "Starter Plan",
        price: 29,
        minutes: 240,
        extraMinutePrice: 0.12,
        agents: 1,
        features: [
            "Included minutes: 240",
            "Cost per minute: $0.12 (12 cents)",
            "1 AI voice agent",
            "1 Email campaign",
            "1 Call campaign",
            "Standard voices only",
            "Basic call campaigns",
            "Simple conversational workflows",
        ],
        description: "Small teams & early users",
        target: "Small teams & early users",
        whitelabelEnabled: false,
        maxAssistants: 1,
        maxEmailCampaigns: 1,
        maxCallCampaigns: 1
    },
    growth: {
        key: "growth",
        name: "Growth Plan",
        price: 79,
        minutes: 830,
        extraMinutePrice: 0.095,
        agents: 3,
        features: [
            "Included minutes: 830",
            "Cost per minute: $0.095 (9.5 cents)",
            "Up to 3 AI voice agents",
            "Up to 5 Email campaigns",
            "Up to 5 Call campaigns",
            "✅ Premium voices enabled",
            "Advanced call campaigns",
            "Email campaigns + automation",
            "SMS bot creation",
            "Multi-step conversational workflows",
        ],
        description: "Premium voices start here",
        target: "Startups & sales teams",
        whitelabelEnabled: false,
        maxAssistants: 3,
        maxEmailCampaigns: 5,
        maxCallCampaigns: 5
    },
    pro: {
        key: "pro",
        name: "Pro Plan",
        price: 149,
        minutes: 1860,
        extraMinutePrice: 0.08,
        agents: 10,
        features: [
            "Included minutes: 1,860",
            "Cost per minute: $0.08 (8 cents)",
            "Up to 10 AI voice agents",
            "Up to 20 Email campaigns",
            "Up to 20 Call campaigns",
            "✅ Premium voices",
            "Bulk call campaigns",
            "Advanced conversational logic",
            "Email + SMS automation",
            "Webhooks & integrations",
            "Priority support",
        ],
        description: "Call centers & SaaS businesses",
        target: "Call centers & SaaS businesses",
        whitelabelEnabled: true,
        maxAssistants: 10,
        maxEmailCampaigns: 20,
        maxCallCampaigns: 20
    },
    enterprise: {
        key: "enterprise",
        name: "Enterprise Plan",
        price: "Custom",
        features: [
            "Custom / high-volume minutes",
            "Unlimited AI voice agents",
            "Unlimited Email & Call campaigns",
            "✅ Premium + custom voices",
            "Advanced call & SMS campaigns",
            "Custom conversational workflows",
            "Dedicated infrastructure",
            "SLA & onboarding support",
            "✅ White-label included"
        ],
        description: "Enterprises & agencies",
        target: "Enterprises & agencies",
        whitelabelEnabled: true,
        maxAssistants: 0, // Unlimited
        maxEmailCampaigns: 0,
        maxCallCampaigns: 0
    }
};

// Cache for plan configs
let planConfigsCache: Record<string, PlanConfig> | null = null;
let planConfigsCacheTime: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Get current tenant from hostname
 */
function getCurrentTenant(): string | null {
    if (typeof window === 'undefined') {
        return null;
    }

    try {
        const tenant = extractTenantFromHostname();
        return tenant === 'main' ? null : tenant;
    } catch (error) {
        console.warn('Error extracting tenant:', error);
        return null;
    }
}

/**
 * Fetch plan configs from database
 */
async function fetchPlanConfigsFromDB(tenant?: string | null): Promise<Record<string, PlanConfig>> {
    try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';
        const currentTenant = tenant ?? getCurrentTenant();

        const url = new URL(`${backendUrl}/api/v1/plans`);
        if (currentTenant) {
            url.searchParams.append('tenant', currentTenant);
        }

        const response = await fetch(url.toString());
        if (!response.ok) {
            return {};
        }

        const result = await response.json();
        if (!result.success || !result.data) {
            return {};
        }

        const plansArray = result.data;
        const mergedPlans: Record<string, PlanConfig> = {};

        plansArray.forEach((plan: any) => {
            mergedPlans[plan.key] = {
                key: plan.key,
                name: plan.name || "Unknown Plan",
                price: isNaN(Number(plan.price)) ? plan.price : Number(plan.price),
                minutes: plan.minutes !== undefined ? Number(plan.minutes) : undefined,
                extraMinutePrice: plan.extraMinutePrice !== undefined ? Number(plan.extraMinutePrice) : undefined,
                agents: plan.agents,
                features: Array.isArray(plan.features) ? plan.features : [],
                whitelabelEnabled: plan.whitelabelEnabled,
                variantId: plan.variantId,
                description: plan.description,
                target: plan.target,
                maxAssistants: plan.maxAssistants,
                maxEmailCampaigns: plan.maxEmailCampaigns,
                maxCallCampaigns: plan.maxCallCampaigns,
                payAsYouGo: plan.payAsYouGo
            };
        });

        return mergedPlans;

    } catch (error) {
        console.error('Error fetching plan configs:', error);
        return {};
    }
}

/**
 * Get plan configs (from cache or database)
 */
export async function getPlanConfigs(tenant?: string | null): Promise<Record<string, PlanConfig>> {
    const now = Date.now();

    if (!tenant && planConfigsCache && (now - planConfigsCacheTime) < CACHE_DURATION) {
        return planConfigsCache;
    }

    const configs = await fetchPlanConfigsFromDB(tenant);

    if (!tenant && Object.keys(configs).length > 0) {
        planConfigsCache = configs;
        planConfigsCacheTime = now;
    }

    return configs;
}

/**
 * Get plan configs synchronously (uses cache or defaults)
 */
export function getPlanConfigsSync(): Record<string, PlanConfig> {
    return planConfigsCache || DEFAULT_PLAN_CONFIGS;
}

/**
 * Get single plan config
 */
export function getPlanConfig(planKey: string | null | undefined): PlanConfig {
    const configs = getPlanConfigsSync();
    const plan = planKey ? configs[planKey.toLowerCase()] : null;
    return plan ?? configs.free ?? DEFAULT_PLAN_CONFIGS.free;
}

/**
 * Invalidate cache
 */
export function invalidatePlanConfigsCache(): void {
    planConfigsCache = null;
    planConfigsCacheTime = 0;
}

export const PLAN_CONFIGS = DEFAULT_PLAN_CONFIGS;
export type { PlanConfig as PlanConfigType };
