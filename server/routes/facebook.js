
import express from 'express';
import fetch from 'node-fetch';
import Twilio from 'twilio';
import {
    FacebookIntegration,
    Campaign,
    CampaignCall,
    Assistant,
    PhoneNumber,
    UserTwilioCredential,
    User,
    UserFacebookCredential
} from '../models/index.js';

const router = express.Router();

// --- Credential Management Routes ---

// Save or Update Facebook App Credentials
router.post('/credentials', async (req, res) => {
    try {
        const { userId, appId, appSecret } = req.body;

        if (!userId || !appId || !appSecret) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        const creds = await UserFacebookCredential.findOneAndUpdate(
            { user_id: userId },
            {
                user_id: userId,
                app_id: appId,
                app_secret: appSecret,
                updated_at: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Credentials saved successfully' });
    } catch (error) {
        console.error('Error saving FB credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to save credentials' });
    }
});

// Get Facebook App ID (Publicly specific to the user context)
router.get('/credentials/:userId', async (req, res) => {
    try {
        const creds = await UserFacebookCredential.findOne({ user_id: req.params.userId });
        if (!creds) {
            return res.json({ success: false, message: 'No credentials found' });
        }
        res.json({ success: true, appId: creds.app_id });
    } catch (error) {
        console.error('Error fetching FB credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
    }
});

// --- Existing Routes Updated ---

// Exchange short-lived user token for long-lived one
router.post('/exchange-token', async (req, res) => {
    try {
        const { shortLivedToken, userId } = req.body; // userId is now required to find credentials

        if (!shortLivedToken) {
            return res.status(400).json({ success: false, message: 'Short-lived token is required' });
        }

        // Try to fetch user-specific credentials first
        let appId = process.env.FACEBOOK_APP_ID;
        let appSecret = process.env.FACEBOOK_APP_SECRET;

        if (userId) {
            const userCreds = await UserFacebookCredential.findOne({ user_id: userId });
            if (userCreds) {
                appId = userCreds.app_id;
                appSecret = userCreds.app_secret;
            }
        }

        if (!appId || !appSecret) {
            return res.status(400).json({ success: false, message: 'Facebook App Configuration not found. Please set App ID and Secret in settings.' });
        }

        const url = new URL('https://graph.facebook.com/v19.0/oauth/access_token');
        url.searchParams.append('grant_type', 'fb_exchange_token');
        url.searchParams.append('client_id', appId);
        url.searchParams.append('client_secret', appSecret);
        url.searchParams.append('fb_exchange_token', shortLivedToken);

        const response = await fetch(url);
        const data = await response.json();

        if (data.error) throw data.error;

        res.json({ success: true, accessToken: data.access_token });
    } catch (error) {
        console.error('Error exchanging token:', error);
        res.status(500).json({ success: false, message: 'Failed to exchange token', error: error.message });
    }
});

// Subscribe page to webhooks and save integration
router.post('/subscribe', async (req, res) => {
    try {
        const { userId, pageId, pageName, pageAccessToken, assistantId } = req.body;

        if (!userId || !pageId || !pageAccessToken || !assistantId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // 1. Subscribe App to Page Webhooks
        try {
            const url = `https://graph.facebook.com/v19.0/${pageId}/subscribed_apps?subscribed_fields=leadgen&access_token=${pageAccessToken}`;
            const fbRes = await fetch(url, { method: 'POST' });
            const fbData = await fbRes.json();

            if (!fbRes.ok || fbData.error) {
                throw fbData.error || new Error('Facebook subscription failed');
            }
        } catch (fbError) {
            console.error('Facebook Subscription Error:', fbError);
            return res.status(500).json({
                success: false,
                message: 'Failed to subscribe app to page. Check permissions.'
            });
        }

        // 2. Save Integration
        await FacebookIntegration.findOneAndUpdate(
            { user_id: userId, page_id: pageId },
            {
                user_id: userId,
                page_id: pageId,
                page_name: pageName,
                page_access_token: pageAccessToken,
                assistant_id: assistantId,
                connected_at: new Date()
            },
            { upsert: true, new: true }
        );

        res.json({ success: true, message: 'Page connected and subscribed successfully' });
    } catch (error) {
        console.error('Error subscribing page:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

// List connected pages
router.get('/integrations/:userId', async (req, res) => {
    try {
        const integrations = await FacebookIntegration.find({ user_id: req.params.userId });
        res.json({ success: true, integrations });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching integrations' });
    }
});

// Webhook Verification
const VERIFY_TOKEN = process.env.FACEBOOK_WEBHOOK_VERIFY_TOKEN || 'ultratalk_leads_verify_token';

router.get('/config', (req, res) => {
    const baseUrl = process.env.NGROK_URL || process.env.BACKEND_URL || 'http://localhost:4000';
    res.json({
        success: true,
        callbackUrl: `${baseUrl}/api/v1/facebook/webhook`,
        verifyToken: VERIFY_TOKEN
    });
});

router.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode && token) {
        if (mode === 'subscribe' && token === VERIFY_TOKEN) {
            console.log('WEBHOOK_VERIFIED');
            res.status(200).send(challenge);
        } else {
            res.sendStatus(403);
        }
    } else {
        res.sendStatus(400); // Bad Request if parameters are missing
    }
});

// Handle Webhook Events
router.post('/webhook', async (req, res) => {
    // Respond immediately to avoid timeouts
    res.sendStatus(200);

    try {
        const body = req.body;

        if (body.object === 'page') {
            for (const entry of body.entry) {
                const pageId = entry.id;

                for (const change of entry.changes) {
                    if (change.field === 'leadgen') {
                        const leadgenId = change.value.leadgen_id;
                        console.log(`Received leadgen event: ${leadgenId} for page ${pageId}`);

                        await handleNewLead(pageId, leadgenId);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error processing webhook:', error);
    }
});

async function handleNewLead(pageId, leadgenId) {
    try {
        // 1. Find Integration
        const integration = await FacebookIntegration.findOne({ page_id: pageId });
        if (!integration) {
            console.error(`No integration found for page ${pageId}`);
            return;
        }

        // 2. Fetch Lead Details
        const response = await fetch(`https://graph.facebook.com/v19.0/${leadgenId}?access_token=${integration.page_access_token}`);
        const leadData = await response.json();

        if (leadData.error) {
            throw leadData.error;
        }

        // console.log('Lead Data:', JSON.stringify(leadData, null, 2));

        // 3. Extract Info (Phone, Name)
        let phoneNumber = null;
        let fullName = 'Facebook Lead';
        let email = null;

        if (leadData.field_data) {
            for (const field of leadData.field_data) {
                if (field.name === 'phone_number') {
                    phoneNumber = field.values[0];
                } else if (field.name === 'full_name' || field.name === 'first_name') {
                    fullName = field.values[0];
                } else if (field.name === 'email') {
                    email = field.values[0];
                }
            }
        }

        if (!phoneNumber) {
            console.error('No phone number found in lead data');
            return;
        }

        // 4. Trigger Call (Replicating outbound-calls.js logic)
        await triggerCall(integration.user_id, integration.assistant_id, phoneNumber, fullName, email, pageId);

    } catch (error) {
        console.error('Error handling new lead:', error.message || error);
    }
}

async function triggerCall(userId, assistantId, phoneNumber, contactName, email, pageId) {
    try {
        console.log(`Triggering call for user ${userId}, assistant ${assistantId}, to ${phoneNumber}`);

        // Get Assistant
        const assistant = await Assistant.findById(assistantId);
        if (!assistant) {
            console.error('Assistant not found');
            return;
        }

        // Ensure "Facebook Leads" Campaign Exists
        let campaign = await Campaign.findOne({
            user_id: userId,
            name: 'Facebook Leads Auto-Response'
        });

        if (!campaign) {
            campaign = await Campaign.create({
                user_id: userId,
                assistant_id: assistantId,
                name: 'Facebook Leads Auto-Response',
                status: 'running',
                execution_status: 'running',
                type: 'outbound',
                contact_source: 'contact_list', // Dummy
                tenant: 'main' // Update if multi-tenant
            });
        }

        // Get Credentials
        const credentials = await UserTwilioCredential.findOne({
            user_id: userId,
            is_active: true
        });

        if (!credentials) {
            console.error('No active Twilio credentials for user');
            return; // Can't call without credentials
        }

        // Determine From Number
        let fromPhoneNumber = null;
        const assistantPhone = await PhoneNumber.findOne({
            inbound_assistant_id: assistantId,
            status: 'active'
        });

        if (assistantPhone) {
            fromPhoneNumber = assistantPhone.number;
        }

        if (!fromPhoneNumber) {
            // Fallback or error
            console.error('No phone number linked to assistant');
            return;
        }

        const roomName = `fb-lead-${Date.now()}`;
        const baseUrl = process.env.NGROK_URL || process.env.BACKEND_URL; // Verify env var name
        const livekitRoomUrl = `${baseUrl}/api/v1/livekit/room/${roomName}`;

        // Create Campaign Call
        const campaignCall = await CampaignCall.create({
            campaign_id: campaign._id,
            phone_number: phoneNumber,
            contact_name: contactName,
            email: email,
            room_name: roomName,
            status: 'calling',
            scheduled_at: new Date(),
            tenant: campaign.tenant || 'main',
            notes: `Lead from Facebook Page ID: ${pageId}`
        });

        const userTwilio = Twilio(credentials.account_sid, credentials.auth_token);

        const call = await userTwilio.calls.create({
            to: phoneNumber,
            from: fromPhoneNumber,
            url: livekitRoomUrl,
            method: 'POST',
            statusCallback: `${baseUrl}/api/v1/outbound-calls/status-callback`,
            statusCallbackEvent: ['initiated', 'ringing', 'answered', 'completed'],
            statusCallbackMethod: 'POST',
            record: true,
            recordingChannels: 'dual',
            recordingTrack: 'both',
            recordingStatusCallback: `${baseUrl}/api/v1/recording/status`,
            recordingStatusCallbackMethod: 'POST'
        });

        // Update campaign call with Twilio call SID
        campaignCall.call_sid = call.sid;
        campaignCall.started_at = new Date();
        await campaignCall.save();

        // Update Campaign Stats
        const updateResult = await Campaign.updateOne(
            { _id: campaign._id },
            {
                $inc: {
                    total_calls_made: 1,
                    current_daily_calls: 1
                },
                $set: { last_execution_at: new Date() }
            }
        );

        console.log(`Call initiated successfully: ${call.sid}`);

    } catch (error) {
        console.error('Failed to trigger call:', error);
    }
}

export default router;
