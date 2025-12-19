/**
 * Plan Configuration
 * Fetches from database to determine features and whitelabel status
 */

import { extractTenantFromHostname } from './tenant-utils';

export interface PlanConfig {
    key: string;
    name: string;
    price: number;
    minutes?: number;
    payAsYouGo?: boolean;
    features: string[];
    whitelabelEnabled?: boolean;
}

// Minimal fallback plans
export const DEFAULT_PLAN_CONFIGS: Record<string, PlanConfig> = {
    free: {
        key: "free",
        name: "Free",
        price: 0,
        features: ["Basic features"],
        whitelabelEnabled: false
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
                price: isNaN(Number(plan.price)) ? 0 : Number(plan.price),
                minutes: plan.minutes !== undefined ? Number(plan.minutes) : undefined,
                payAsYouGo: plan.payAsYouGo ?? false,
                features: Array.isArray(plan.features) ? plan.features : [],
                whitelabelEnabled: plan.whitelabelEnabled
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
