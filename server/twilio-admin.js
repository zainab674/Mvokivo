// server/twilio-admin.js
import express from 'express';
import Twilio from 'twilio';
import { UserTwilioCredential, PhoneNumber } from './models/index.js';

export const twilioAdminRouter = express.Router();

/** Build our public base URL (works locally & behind tunnels) */
function getBase(req) {
    if (process.env.PUBLIC_BASE_URL) return process.env.PUBLIC_BASE_URL.replace(/\/+$/, '');
    const proto = req.protocol || 'http';
    return `${proto}://${req.get('host')}`;
}

/** Twilio demo URL helper (ignore it when deciding "used") */
function isTwilioDemoUrl(url = '') {
    const u = String(url).trim().toLowerCase();
    return u.startsWith('https://demo.twilio.com') || u.startsWith('http://demo.twilio.com');
}

/** PV configured? (treat demo URL as NOT configured) */
function hasProgrammableVoice(n) {
    const hasApp = Boolean(n.voiceApplicationSid);
    const hasRealUrl = Boolean(n.voiceUrl && n.voiceUrl.trim()) && !isTwilioDemoUrl(n.voiceUrl);
    return hasApp || hasRealUrl;
}

/** Is the number unused by our webhook/app? (demo URL is "not ours") */
function isUnusedForOurWebhook(n, base) {
    const ours =
        !!n.voiceUrl &&
        (n.voiceUrl.startsWith(`${base}/twilio/`) || n.voiceUrl.startsWith(`${base}/api/`));
    return !ours;
}

/** Strict = truly unused: no PV (ignoring demo URL) AND not on a trunk */
function isStrictlyUnused(n) {
    const onTrunk = Boolean(n.trunkSid);
    return !hasProgrammableVoice(n) && !onTrunk;
}

/** Classify usage for UI badges */
function classifyUsage(n, base) {
    if (n.trunkSid) return 'trunk';
    if (n.voiceApplicationSid) return 'app';
    if (n.voiceUrl) {
        if (isTwilioDemoUrl(n.voiceUrl)) return 'demo';
        const ours =
            n.voiceUrl.startsWith(`${base}/twilio/`) || n.voiceUrl.startsWith(`${base}/api/`);
        return ours ? 'ours' : 'foreign';
    }
    return 'unused';
}

twilioAdminRouter.get('/__ping', (_req, res) => {
    res.json({ ok: true, where: 'twilio-admin router' });
});

/**
 * GET /api/v1/twilio/phone-numbers
 * GET /api/v1/twilio/phone-numbers?unused=1
 * GET /api/v1/twilio/phone-numbers?unused=1&strict=1
 */
twilioAdminRouter.get('/phone-numbers', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User ID required' });
        }

        // Get user's active credentials
        const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

        if (!credentials) {
            return res.status(404).json({ success: false, message: 'No Twilio credentials found' });
        }

        // Create Twilio client with user's credentials
        const userTwilio = Twilio(credentials.account_sid, credentials.auth_token);

        const base = getBase(req);
        const unusedOnly = req.query.unused === '1';
        const strict = req.query.strict === '1';

        // Optional: numbers you've mapped in your DB
        let mappedSet = new Set();
        try {
            const numbers = await PhoneNumber.find().select('number');
            mappedSet = new Set((numbers || []).map((m) => m.number));
        } catch (err) {
            // ignore
        }

        const all = await userTwilio.incomingPhoneNumbers.list({ limit: 1000 });

        const rows = all.map((n) => {
            const row = {
                sid: n.sid,
                phoneNumber: n.phoneNumber,
                friendlyName: n.friendlyName || '',
                voiceUrl: n.voiceUrl || '',
                voiceApplicationSid: n.voiceApplicationSid || '',
                trunkSid: n.trunkSid || null,
                mapped: mappedSet.has(n.phoneNumber),
            };
            return { ...row, usage: classifyUsage(row, base) }; // 'unused' | 'demo' | 'ours' | 'foreign' | 'app' | 'trunk'
        });

        const filtered = unusedOnly
            ? rows.filter((n) => (strict ? isStrictlyUnused(n) : isUnusedForOurWebhook(n, base)) && !n.mapped)
            : rows;

        res.json({ success: true, numbers: filtered });
    } catch (e) {
        console.error('twilio/phone-numbers error', {
            code: e?.code,
            status: e?.status,
            message: e?.message,
        });
        res.status(500).json({ success: false, message: 'Failed to fetch numbers' });
    }
});

/**
 * OPTION A (Webhook mode): assign number to your webhook + save mapping
 * POST /api/v1/twilio/assign
 * body: { phoneSid, assistantId, label? }
 */
twilioAdminRouter.post('/assign', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User ID required' });
        }

        const { phoneSid, assistantId, label } = req.body || {};
        if (!phoneSid || !assistantId) {
            return res.status(400).json({ success: false, message: 'phoneSid and assistantId are required' });
        }

        // Get user's active credentials
        const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

        if (!credentials) {
            return res.status(404).json({ success: false, message: 'No Twilio credentials found' });
        }

        // Create Twilio client with user's credentials
        const userTwilio = Twilio(credentials.account_sid, credentials.auth_token);

        const base = getBase(req);
        const num = await userTwilio.incomingPhoneNumbers(phoneSid).fetch();

        await userTwilio.incomingPhoneNumbers(phoneSid).update({
            voiceUrl: `${base}/twilio/incoming`,
            voiceMethod: 'POST',
        });

        // Configure SMS webhook for the phone number when assigned to assistant
        const baseUrl = process.env.NGROK_URL || process.env.BACKEND_URL;
        if (baseUrl) {
            try {
                await userTwilio.incomingPhoneNumbers(phoneSid).update({
                    smsUrl: `${baseUrl}/api/v1/twilio/sms/webhook`,
                    smsMethod: 'POST',
                    statusCallback: `${baseUrl}/api/v1/twilio/sms/status-callback`,
                    statusCallbackMethod: 'POST'
                });
                console.log(`✅ Configured SMS webhook for assigned phone number ${num.phoneNumber}: ${baseUrl}/api/v1/twilio/sms/webhook`);
            } catch (webhookError) {
                console.error(`❌ Failed to configure SMS webhook for ${num.phoneNumber}:`, webhookError.message);
            }
        } else {
            console.warn('No base URL configured for SMS webhooks. Set NGROK_URL or BACKEND_URL environment variable.');
        }

        try {
            await PhoneNumber.findOneAndUpdate(
                { phone_sid: num.sid },
                {
                    phone_sid: num.sid,
                    number: num.phoneNumber,
                    label: label || num.friendlyName || null,
                    inbound_assistant_id: assistantId,
                    webhook_status: 'configured',
                    status: 'active',
                    // user_id: userId // Should we save userId? The schema has user_id.
                    // Assuming we should attach user_id if we have it
                    user_id: userId
                },
                { upsert: true, new: true }
            );
        } catch (error) {
            console.warn('Failed to save phone number mapping (Mongoose error):', error.message);
        }

        res.json({ success: true, number: { sid: num.sid, phoneNumber: num.phoneNumber } });
    } catch (e) {
        console.error('twilio/assign error', e);
        res.status(500).json({ success: false, message: 'Assign failed' });
    }
});

/** List trunks (Option B) */
twilioAdminRouter.get('/trunks', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User ID required' });
        }

        // Get user's active credentials
        const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

        if (!credentials) {
            return res.status(404).json({ success: false, message: 'No Twilio credentials found' });
        }

        // Create Twilio client with user's credentials
        const userTwilio = Twilio(credentials.account_sid, credentials.auth_token);

        const trunks = await userTwilio.trunking.v1.trunks.list({ limit: 100 });
        res.json({
            success: true,
            trunks: trunks.map((t) => ({
                sid: t.sid,
                name: t.friendlyName,
                domainName: t.domainName,
            })),
        });
    } catch (e) {
        console.error('twilio/trunks error', e);
        res.status(500).json({ success: false, message: 'Failed to list trunks' });
    }
});

/**
 * Attach DID to a trunk (Option B)
 * POST /api/v1/twilio/trunk/attach
 * body: { phoneSid: "PNxxx", trunkSid?: "TRxxx" }
 */
twilioAdminRouter.post('/trunk/attach', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User ID required' });
        }

        const phoneSid = req.body?.phoneSid;
        const trunkSid = req.body?.trunkSid;

        if (!phoneSid) return res.status(400).json({ success: false, message: 'phoneSid is required' });
        if (!trunkSid)
            return res
                .status(400)
                .json({ success: false, message: 'trunkSid is required' });

        // Get user's active credentials
        const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

        if (!credentials) {
            return res.status(404).json({ success: false, message: 'No Twilio credentials found' });
        }

        // Create Twilio client with user's credentials
        const userTwilio = Twilio(credentials.account_sid, credentials.auth_token);

        const result = await userTwilio.trunking.v1.trunks(trunkSid).phoneNumbers.create({ phoneNumberSid: phoneSid });

        res.json({ success: true, attached: { trunkSid, phoneSid, sid: result?.sid || null } });
    } catch (e) {
        console.error('twilio/trunk/attach error', e);
        res.status(500).json({ success: false, message: e?.message || 'Attach failed' });
    }
});



// ⬇️ add to server/twilio-admin.js (near the other routes)

// POST /api/v1/twilio/map
// body: { phoneSid?: "PNxxx", phoneNumber?: "+19862108561", assistantId: "..." , label?, outboundTrunkId?, outboundTrunkName? }
twilioAdminRouter.post('/map', async (req, res) => {
    try {
        const userId = req.headers['x-user-id'];
        if (!userId) {
            return res.status(401).json({ success: false, message: 'User ID required' });
        }

        const { phoneSid, phoneNumber, assistantId, label, outboundTrunkId, outboundTrunkName } = req.body || {};
        if (!assistantId || (!phoneSid && !phoneNumber)) {
            return res.status(400).json({ success: false, message: 'assistantId and phoneSid or phoneNumber are required' });
        }

        console.log(`Mapping phone ${phoneSid || phoneNumber} to assistant ${assistantId} for user ${userId}`);

        // Get user's active credentials
        const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

        if (!credentials) {
            return res.status(404).json({ success: false, message: 'No Twilio credentials found' });
        }

        // Create Twilio client with user's credentials
        const userTwilio = Twilio(credentials.account_sid, credentials.auth_token);

        // normalize number (fetch from Twilio if only PN SID provided)
        let e164 = phoneNumber;
        if (!e164 && phoneSid) {
            try {
                const num = await userTwilio.incomingPhoneNumbers(phoneSid).fetch();
                e164 = num.phoneNumber;
                console.log(`Resolved phone number: ${e164} from SID: ${phoneSid}`);
            } catch (phoneError) {
                console.error('Error fetching phone number:', phoneError);
                if (phoneError.status === 404) {
                    return res.status(404).json({
                        success: false,
                        message: 'Phone number not found in Twilio account'
                    });
                }
                throw phoneError;
            }
        }
        if (!e164) return res.status(400).json({ success: false, message: 'Could not resolve phone number' });

        try {
            await PhoneNumber.findOneAndUpdate(
                { number: e164 },
                {
                    phone_sid: phoneSid || null,
                    number: e164,
                    label: label || null,
                    inbound_assistant_id: assistantId,
                    outbound_trunk_id: outboundTrunkId || null,
                    outbound_trunk_name: outboundTrunkName || null,
                    webhook_status: 'configured',
                    status: 'active',
                    user_id: userId
                },
                { upsert: true, new: true }
            );
            console.log('Successfully saved phone number to database');

        } catch (dbError) {
            console.error('Database operation failed:', dbError);
        }

        // Configure SMS webhook for the phone number when assigned to assistant
        const baseUrl = process.env.NGROK_URL || process.env.BACKEND_URL;
        if (baseUrl && phoneSid) {
            try {
                await userTwilio.incomingPhoneNumbers(phoneSid).update({
                    smsUrl: `${baseUrl}/api/v1/twilio/sms/webhook`,
                    smsMethod: 'POST',
                    statusCallback: `${baseUrl}/api/v1/twilio/sms/status-callback`,
                    statusCallbackMethod: 'POST'
                });
                console.log(`✅ Configured SMS webhook for assistant phone number ${e164}: ${baseUrl}/api/v1/twilio/sms/webhook`);
            } catch (webhookError) {
                console.error(`❌ Failed to configure SMS webhook for ${e164}:`, webhookError.message);
            }
        } else if (!baseUrl) {
            console.warn('No base URL configured for SMS webhooks. Set NGROK_URL or BACKEND_URL environment variable.');
        } else if (!phoneSid) {
            console.warn('No phoneSid provided - cannot configure SMS webhook');
        }

        res.json({ success: true, mapped: { phoneSid: phoneSid || null, number: e164, assistantId } });
    } catch (e) {
        console.error('twilio/map error', e);
        console.error('Error details:', {
            message: e.message,
            status: e.status,
            code: e.code,
            moreInfo: e.moreInfo
        });

        // Return more specific error message
        const errorMessage = e.message || 'Map failed';
        res.status(500).json({
            success: false,
            message: errorMessage,
            details: process.env.NODE_ENV === 'development' ? {
                status: e.status,
                code: e.code,
                moreInfo: e.moreInfo
            } : undefined
        });
    }
});

/**
 * GET /api/v1/twilio/phone-numbers/lookup?number=+1234567890
 * Lookup assistant ID by phone number (for LiveKit agent)
 */
twilioAdminRouter.get('/phone-numbers/lookup', async (req, res) => {
    try {
        const { number } = req.query;

        if (!number) {
            return res.status(400).json({ success: false, message: 'Phone number is required' });
        }

        // Find the phone number mapping in database
        const phoneMapping = await PhoneNumber.findOne({ number: number });

        if (!phoneMapping) {
            return res.status(404).json({ success: false, message: 'Phone number not found' });
        }

        res.json({
            success: true,
            inbound_assistant_id: phoneMapping.inbound_assistant_id,
            phone_sid: phoneMapping.phone_sid,
            label: phoneMapping.label
        });
    } catch (e) {
        console.error('twilio/phone-numbers/lookup error', e);
        res.status(500).json({ success: false, message: 'Lookup failed' });
    }
});

