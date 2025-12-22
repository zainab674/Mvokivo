
import crypto from 'crypto';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../.env') });

const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

if (!secret) {
    console.error('LEMONSQUEEZY_WEBHOOK_SECRET not found in .env');
    process.exit(1);
}

console.log(`Using secret: ${secret.substring(0, 5)}...`);

const payload = {
    "data": {
        "id": "7111514",
        "type": "orders",
        "links": {
            "self": "https://api.lemonsqueezy.com/v1/orders/7111514"
        },
        "attributes": {
            "tax": 0,
            "urls": {
                "receipt": "https://app.lemonsqueezy.com/my-orders/12857045-6839-4982-9f06-fff757fd6a0c?expires=1766459245&signature=791e682aa445dfaf89f12f65a3eed6aad1f3d6e8ebbc337a3913c8904183e641"
            },
            "total": 15000,
            "status": "paid",
            "tax_usd": 0,
            "currency": "USD",
            "refunded": false,
            "store_id": 259512,
            "subtotal": 15000,
            "tax_name": "Sales Tax",
            "tax_rate": 0,
            "setup_fee": 0,
            "test_mode": true,
            "total_usd": 15000,
            "user_name": "rrrrrrrrrrrrrrrrr",
            "created_at": "2025-12-22T21:07:23.000000Z",
            "identifier": "12857045-6839-4982-9f06-fff757fd6a0c",
            "updated_at": "2025-12-22T21:07:24.000000Z",
            "user_email": "avenus6@gmail.com",
            "customer_id": 7416655,
            "refunded_at": null,
            "order_number": 2595129,
            "subtotal_usd": 15000,
            "currency_rate": "1.00000000",
            "setup_fee_usd": 0,
            "tax_formatted": "$0.00",
            "tax_inclusive": false,
            "discount_total": 0,
            "refunded_amount": 0,
            "total_formatted": "$150.00",
            "first_order_item": {
                "id": 7049786,
                "price": 15000,
                "order_id": 7111514,
                "price_id": 1921211,
                "quantity": 1,
                "test_mode": true,
                "created_at": "2025-12-22T21:07:25.000000Z",
                "product_id": 740720,
                "updated_at": "2025-12-22T21:07:25.000000Z",
                "variant_id": 1165967,
                "product_name": "starter plan",
                "variant_name": "Default"
            },
            "status_formatted": "Paid",
            "discount_total_usd": 0,
            "subtotal_formatted": "$150.00",
            "refunded_amount_usd": 0,
            "setup_fee_formatted": "$0.00",
            "discount_total_formatted": "$0.00",
            "refunded_amount_formatted": "$0.00"
        },
        "relationships": {
            "store": {
                "links": {
                    "self": "https://api.lemonsqueezy.com/v1/orders/7111514/relationships/store",
                    "related": "https://api.lemonsqueezy.com/v1/orders/7111514/store"
                }
            },
            "customer": {
                "links": {
                    "self": "https://api.lemonsqueezy.com/v1/orders/7111514/relationships/customer",
                    "related": "https://api.lemonsqueezy.com/v1/orders/7111514/customer"
                }
            },
            "order-items": {
                "links": {
                    "self": "https://api.lemonsqueezy.com/v1/orders/7111514/relationships/order-items",
                    "related": "https://api.lemonsqueezy.com/v1/orders/7111514/order-items"
                }
            },
            "license-keys": {
                "links": {
                    "self": "https://api.lemonsqueezy.com/v1/orders/7111514/relationships/license-keys",
                    "related": "https://api.lemonsqueezy.com/v1/orders/7111514/license-keys"
                }
            },
            "subscriptions": {
                "links": {
                    "self": "https://api.lemonsqueezy.com/v1/orders/7111514/relationships/subscriptions",
                    "related": "https://api.lemonsqueezy.com/v1/orders/7111514/subscriptions"
                }
            },
            "discount-redemptions": {
                "links": {
                    "self": "https://api.lemonsqueezy.com/v1/orders/7111514/relationships/discount-redemptions",
                    "related": "https://api.lemonsqueezy.com/v1/orders/7111514/discount-redemptions"
                }
            }
        }
    },
    "meta": {
        "test_mode": true,
        "event_name": "order_created",
        "webhook_id": "51f0b6a8-4192-49cd-a939-25f9bfd16d6e",
        "custom_data": {
            "user_id": "7f626de5-97b2-4ed1-ba42-f127385af109"
        }
    }
};

const payloadString = JSON.stringify(payload);
const hmac = crypto.createHmac('sha256', secret);
const signature = hmac.update(payloadString).digest('hex');

console.log(`Generated Signature: ${signature}`);

const PORT = 4000; // Assuming default

async function sendWebhook() {
    try {
        const response = await fetch(`http://localhost:${PORT}/api/v1/webhooks/lemonsqueezy`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Signature': signature
            },
            body: payloadString
        });

        console.log(`Response Status: ${response.status}`);
        const text = await response.text();
        console.log(`Response Body: ${text}`);
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

sendWebhook();
