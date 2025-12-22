
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { LemonSqueezyConfig } from '../models/index.js';
import fs from 'fs';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('MongoDB connection error:', error);
        process.exit(1);
    }
};

const log = (msg) => {
    console.log(msg);
    fs.appendFileSync('ls-debug.log', msg + '\n');
};

const listResources = async () => {
    await connectDB();

    try {
        fs.writeFileSync('ls-debug.log', ''); // Clear file

        const lsConfig = await LemonSqueezyConfig.findOne({ tenant: 'main' });
        const apiKey = lsConfig?.api_key || process.env.LEMON_SQUEEZY_API_KEY;

        if (!apiKey) {
            log('No Lemon Squeezy API Key found in DB or ENV');
            process.exit(1);
        }

        log('Using API Key: ' + apiKey.substring(0, 5) + '...');

        // 1. Fetch Stores
        log('\n--- STORES ---');
        const storesRes = await fetch('https://api.lemonsqueezy.com/v1/stores', {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/vnd.api+json' }
        });
        const storesData = await storesRes.json();

        if (storesData.errors) {
            log('Error fetching stores: ' + JSON.stringify(storesData.errors, null, 2));
        } else {
            storesData.data.forEach(store => {
                log(`STORE: ${store.id} - ${store.attributes.name}`);
            });
        }

        // 2. Fetch Products
        log('\n--- PRODUCTS ---');
        const productsRes = await fetch('https://api.lemonsqueezy.com/v1/products', {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/vnd.api+json' }
        });
        const productsData = await productsRes.json();

        if (productsData.errors) {
            log('Error fetching products: ' + JSON.stringify(productsData.errors, null, 2));
        } else {
            productsData.data.forEach(product => {
                log(`PRODUCT: ${product.id} - ${product.attributes.name} (Store: ${product.attributes.store_id})`);
            });
        }

        // 3. Fetch Variants
        log('\n--- VARIANTS ---');
        const variantsRes = await fetch('https://api.lemonsqueezy.com/v1/variants', {
            headers: { 'Authorization': `Bearer ${apiKey}`, 'Accept': 'application/vnd.api+json' }
        });
        const variantsData = await variantsRes.json();

        if (variantsData.errors) {
            log('Error fetching variants: ' + JSON.stringify(variantsData.errors, null, 2));
        } else {
            variantsData.data.forEach(variant => {
                log(`VARIANT: ${variant.id} - ${variant.attributes.name} (Product: ${variant.attributes.product_id}) [${variant.attributes.status}]`);
            });
        }

        // 4. Test Checkout Creation
        log('\n--- TEST CHECKOUT CREATION ---');
        const storeId = storesData.data?.[0]?.id;
        const variantId = '1165967'; // The one causing issues

        if (storeId && variantId) {
            const payload = {
                data: {
                    type: "checkouts",
                    attributes: {
                        checkout_data: {
                            email: "test@example.com",
                            name: "Test User"
                        }
                    },
                    relationships: {
                        store: { data: { type: "stores", id: storeId.toString() } },
                        variant: { data: { type: "variants", id: variantId.toString() } }
                    }
                }
            };

            log(`Attempting to create checkout for Store ${storeId} and Variant ${variantId}...`);

            const checkoutRes = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/vnd.api+json',
                    'Content-Type': 'application/vnd.api+json'
                },
                body: JSON.stringify(payload)
            });

            const checkoutJson = await checkoutRes.json();

            if (checkoutRes.ok) {
                const url = checkoutJson.data.attributes.url;
                log('Checkout Created Successfully!');
                log('URL: ' + url);
                console.log('CHECKOUT_URL_RESULT: ' + url);
            } else {
                log('Checkout Creation Failed: ' + JSON.stringify(checkoutJson, null, 2));
            }
        } else {
            log('Skipping checkout test (missing store or variant)');
        }

    } catch (error) {
        log('Script error: ' + error);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
};

listResources();
