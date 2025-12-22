
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, '../../.env') });

import { PlanConfig, LemonSqueezyConfig } from '../models/index.js';
import connectDB from '../lib/db.js';

const run = async () => {
    await connectDB();

    console.log('--- Lemon Squeezy Configs ---');
    const configs = await LemonSqueezyConfig.find({});
    configs.forEach(c => {
        console.log(`Tenant: ${c.tenant}, Store ID: ${c.store_id}, API Key (last 4): ...${c.api_key.slice(-4)}`);
    });

    console.log('\n--- Plan Configs ---');
    const plans = await PlanConfig.find({});
    plans.forEach(p => {
        console.log(`Plan: ${p.plan_key}, Name: ${p.name}, Variant ID: ${p.variant_id}, Tenant: ${p.tenant}, Active: ${p.is_active}`);
    });

    process.exit(0);
};

run();
