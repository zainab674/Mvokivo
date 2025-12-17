
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { PlanConfig } from './server/models/index.js';

dotenv.config();

const DEFAULT_PLANS = [
    {
        plan_key: "starter",
        name: "Starter",
        price: 19,
        features: [
            "Basic analytics",
            "Email support",
            "2 team members",
            "Standard integrations",
            "Minutes purchased separately"
        ],
        whitelabel_enabled: false,
        tenant: null,
        display_order: 1
    },
    {
        plan_key: "professional",
        name: "Professional",
        price: 49,
        features: [
            "Advanced analytics & reporting",
            "Priority support",
            "10 team members",
            "All integrations",
            "Custom branding",
            "Minutes purchased separately"
        ],
        whitelabel_enabled: false,
        tenant: null,
        display_order: 2
    },
    {
        plan_key: "enterprise",
        name: "Enterprise",
        price: 99,
        features: [
            "Real-time analytics",
            "24/7 phone support",
            "Unlimited team members",
            "Enterprise integrations",
            "Advanced security",
            "Dedicated account manager",
            "Minutes purchased separately"
        ],
        whitelabel_enabled: false,
        tenant: null,
        display_order: 3
    },
    {
        plan_key: "free",
        name: "Free",
        price: 0,
        features: [
            "Basic features",
            "Community support",
            "Minutes purchased separately"
        ],
        whitelabel_enabled: false,
        tenant: null,
        display_order: 0
    }
];

const seedPlans = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');

        for (const plan of DEFAULT_PLANS) {
            const exists = await PlanConfig.findOne({ plan_key: plan.plan_key, tenant: null });
            if (!exists) {
                await PlanConfig.create(plan);
                console.log(`Created plan: ${plan.name}`);
            } else {
                console.log(`Plan already exists: ${plan.name}`);
            }
        }

        console.log('Seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding plans:', error);
        process.exit(1);
    }
};

seedPlans();
