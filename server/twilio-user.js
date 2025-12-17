import express from 'express';
import Twilio from 'twilio';
import { UserTwilioCredential, PhoneNumber, Assistant } from './models/index.js';
import { createMainTrunkForUser } from './twilio-trunk-service.js';
import { authenticateToken } from './utils/auth.js';

export const twilioUserRouter = express.Router();

// Apply auth middleware to all routes
twilioUserRouter.use(authenticateToken);

/**
 * GET /api/v1/twilio/user/test
 */
twilioUserRouter.get('/test', (req, res) => {
  res.json({ success: true, message: 'Twilio user routes are working', timestamp: new Date().toISOString() });
});

/**
 * Get phone number mappings
 * GET /api/v1/twilio/user/mappings
 */
twilioUserRouter.get('/mappings', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get mappings from database: phone numbers for this user that have an assigned assistant
    // Select fields needed for display in AssistantDetailsDialog
    const mappings = await PhoneNumber.find({
      user_id: userId,
      inbound_assistant_id: { $ne: null }
    }).select('phone_sid number label status webhook_status inbound_assistant_id created_at');

    // Map _id to id for frontend compatibility
    const mappedResults = mappings.map(m => ({
      id: m._id,
      phone_sid: m.phone_sid,
      number: m.number,
      label: m.label,
      status: m.status,
      webhook_status: m.webhook_status,
      inbound_assistant_id: m.inbound_assistant_id,
      created_at: m.created_at
    }));

    res.json({ success: true, mappings: mappedResults, total: mappings.length });

  } catch (error) {
    console.error('Error fetching phone number mappings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch mappings' });
  }
});

/**
 * Get user's active Twilio credentials
 * GET /api/v1/twilio/user/credentials
 */
twilioUserRouter.get('/credentials', async (req, res) => {
  try {
    const userId = req.user.id;
    const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

    // Map _id to id
    const responseData = credentials ? { ...credentials.toObject(), id: credentials._id } : null;

    res.json({ success: true, credentials: responseData });
  } catch (error) {
    console.error('Error fetching user Twilio credentials:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
  }
});

/**
 * Get all Twilio credentials for the user
 * GET /api/v1/twilio/user/credentials/all
 */
twilioUserRouter.get('/credentials/all', async (req, res) => {
  try {
    const userId = req.user.id;
    const credentials = await UserTwilioCredential.find({ user_id: userId }).sort({ created_at: -1 });

    // Map _id to id
    const responseData = credentials.map(c => ({ ...c.toObject(), id: c._id }));

    res.json({ success: true, credentials: responseData });
  } catch (error) {
    console.error('Error fetching all Twilio credentials:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
  }
});

/**
 * Update Twilio credentials
 * PUT /api/v1/twilio/user/credentials/:id
 */
twilioUserRouter.put('/credentials/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const updates = req.body;

    const credentials = await UserTwilioCredential.findOne({ _id: id, user_id: userId });

    if (!credentials) {
      return res.status(404).json({ success: false, message: 'Credentials not found' });
    }

    if (updates.accountSid) credentials.account_sid = updates.accountSid;
    if (updates.authToken) credentials.auth_token = updates.authToken;
    if (updates.label) credentials.label = updates.label;

    await credentials.save();

    res.json({ success: true, credentials: { ...credentials.toObject(), id: credentials._id } });
  } catch (error) {
    console.error('Error updating Twilio credentials:', error);
    res.status(500).json({ success: false, message: 'Failed to update credentials' });
  }
});

/**
 * Delete Twilio credentials
 * DELETE /api/v1/twilio/user/credentials/:id
 */
twilioUserRouter.delete('/credentials/:id', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const result = await UserTwilioCredential.deleteOne({ _id: id, user_id: userId });

    if (result.deletedCount === 0) {
      return res.status(404).json({ success: false, message: 'Credentials not found' });
    }

    res.json({ success: true, message: 'Credentials deleted successfully' });
  } catch (error) {
    console.error('Error deleting Twilio credentials:', error);
    res.status(500).json({ success: false, message: 'Failed to delete credentials' });
  }
});

/**
 * Set active credentials
 * POST /api/v1/twilio/user/credentials/:id/activate
 */
twilioUserRouter.post('/credentials/:id/activate', async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    // Deactivate all first
    await UserTwilioCredential.updateMany({ user_id: userId }, { is_active: false });

    // Activate specific one
    const credentials = await UserTwilioCredential.findOneAndUpdate(
      { _id: id, user_id: userId },
      { is_active: true },
      { new: true }
    );

    if (!credentials) {
      return res.status(404).json({ success: false, message: 'Credentials not found' });
    }

    res.json({ success: true, credentials: { ...credentials.toObject(), id: credentials._id } });
  } catch (error) {
    console.error('Error activating Twilio credentials:', error);
    res.status(500).json({ success: false, message: 'Failed to activate credentials' });
  }
});

/**
 * Get user's phone numbers using their credentials
 * GET /api/v1/twilio/user/phone-numbers
 */
twilioUserRouter.get('/phone-numbers', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get user's active credentials
    const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

    if (!credentials) {
      console.log('No credentials found for user:', userId);
      return res.status(404).json({ success: false, message: 'No Twilio credentials found' });
    }

    // Create Twilio client with user's credentials
    const twilio = Twilio(credentials.account_sid, credentials.auth_token);

    const all = await twilio.incomingPhoneNumbers.list({ limit: 1000 });

    const rows = all.map((n) => {
      const row = {
        sid: n.sid,
        phoneNumber: n.phoneNumber,
        friendlyName: n.friendlyName || '',
        voiceUrl: n.voiceUrl || '',
        voiceApplicationSid: n.voiceApplicationSid || '',
        trunkSid: n.trunkSid || null,
        mapped: false, // TODO: Check if mapped in user's phone_number table (Mongoose)
      };
      return { ...row, usage: classifyUsage(row, credentials.trunk_sid) };
    });

    const unusedOnly = req.query.unused === '1';
    const strict = req.query.strict === '1';
    const filtered = unusedOnly
      ? rows.filter((n) => (strict ? isStrictlyUnused(n) : isUnusedForOurWebhook(n, credentials.trunk_sid)) && !n.mapped)
      : rows;

    res.json({ success: true, numbers: filtered });
  } catch (error) {
    console.error('Error fetching user phone numbers:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch phone numbers' });
  }
});

/**
 * Attach phone number to user's trunk
 * POST /api/v1/twilio/user/trunk/attach
 */
twilioUserRouter.post('/trunk/attach', async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneSid } = req.body;

    if (!phoneSid) {
      return res.status(400).json({ success: false, message: 'Phone SID required' });
    }

    console.log(`Attempting to attach phone ${phoneSid} to trunk for user ${userId}`);

    // Get user's active credentials
    const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

    if (!credentials) {
      return res.status(404).json({ success: false, message: 'No Twilio credentials found' });
    }

    if (!credentials.trunk_sid) {
      console.error('No trunk_sid found in credentials for user:', userId);
      return res.status(400).json({
        success: false,
        message: 'No trunk configured. Please create a main trunk first.'
      });
    }

    console.log(`Using trunk_sid: ${credentials.trunk_sid} for user ${userId}`);

    // Create Twilio client with user's credentials
    const twilio = Twilio(credentials.account_sid, credentials.auth_token);

    // Verify the phone number exists and get its details
    let phoneNumber;
    try {
      phoneNumber = await twilio.incomingPhoneNumbers(phoneSid).fetch();
      console.log(`Found phone number: ${phoneNumber.phoneNumber} (${phoneNumber.sid})`);
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

    // Verify the trunk exists
    try {
      const trunk = await twilio.trunking.v1.trunks(credentials.trunk_sid).fetch();
      console.log(`Found trunk: ${trunk.friendlyName} (${trunk.sid})`);
    } catch (trunkError) {
      console.error('Error fetching trunk:', trunkError);
      if (trunkError.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Trunk not found. Please recreate your Twilio credentials.'
        });
      }
      throw trunkError;
    }

    // Attach phone number to user's trunk
    try {
      await twilio.incomingPhoneNumbers(phoneSid).update({
        trunkSid: credentials.trunk_sid,
      });
      console.log(`Successfully attached phone ${phoneNumber.phoneNumber} to trunk ${credentials.trunk_sid}`);
    } catch (attachError) {
      console.error('Error attaching phone to trunk:', attachError);

      // Handle specific Twilio errors
      if (attachError.status === 400) {
        return res.status(400).json({
          success: false,
          message: `Invalid request: ${attachError.message}`
        });
      } else if (attachError.status === 403) {
        return res.status(403).json({
          success: false,
          message: 'Insufficient permissions to modify this phone number'
        });
      } else if (attachError.status === 404) {
        return res.status(404).json({
          success: false,
          message: 'Phone number or trunk not found'
        });
      }
      throw attachError;
    }

    res.json({ success: true, message: 'Phone number attached to trunk' });
  } catch (error) {
    console.error('Error attaching phone to trunk:', error);

    // Return more specific error message
    const errorMessage = error.message || 'Failed to attach phone to trunk';
    res.status(500).json({
      success: false,
      message: errorMessage,
      details: process.env.NODE_ENV === 'development' ? {
        status: error.status,
        code: error.code,
        moreInfo: error.moreInfo
      } : undefined
    });
  }
});

/**
 * Create main trunk for user (auto-generated)
 * POST /api/v1/twilio/user/create-main-trunk
 */
twilioUserRouter.post('/create-main-trunk', async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountSid, authToken, label } = req.body;

    if (!accountSid || !authToken || !label) {
      return res.status(400).json({
        success: false,
        message: 'accountSid, authToken, and label are required'
      });
    }

    // Create main trunk for the user
    const trunkResult = await createMainTrunkForUser({
      accountSid,
      authToken,
      userId,
      label
    });

    if (!trunkResult.success) {
      return res.status(500).json({
        success: false,
        message: trunkResult.message || 'Failed to create main trunk'
      });
    }

    res.json({
      success: true,
      message: 'Main trunk created successfully',
      trunkSid: trunkResult.trunkSid,
      trunkName: trunkResult.trunkName,
      domainName: trunkResult.domainName,
      domainPrefix: trunkResult.domainPrefix,
      credentialListSid: trunkResult.credentialListSid,
      sipUsername: trunkResult.sipUsername,
      sipPassword: trunkResult.sipPassword
    });
  } catch (error) {
    console.error('Error creating main trunk:', error);
    res.status(500).json({
      success: false,
      message: `Failed to create main trunk: ${error.message}`
    });
  }
});

/**
 * Create assistant-specific trunk for user
 * POST /api/v1/twilio/user/assistant-trunk
 */
twilioUserRouter.post('/assistant-trunk', async (req, res) => {
  try {
    const userId = req.user.id;
    const { assistantId, assistantName, phoneNumber } = req.body;

    if (!assistantId || !assistantName || !phoneNumber) {
      return res.status(400).json({ success: false, message: 'assistantId, assistantName, and phoneNumber required' });
    }

    // Get user's active credentials
    const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });

    if (!credentials) {
      return res.status(404).json({ success: false, message: 'No Twilio credentials found' });
    }

    // Create Twilio client with user's credentials
    const twilio = Twilio(credentials.account_sid, credentials.auth_token);

    // Create a new trunk for this assistant
    const trunkName = `assistant-${assistantId}-${phoneNumber.replace('+', '')}`;
    const trunk = await twilio.trunking.v1.trunks.create({
      friendlyName: trunkName,
    });

    res.json({
      success: true,
      trunk: {
        sid: trunk.sid,
        friendlyName: trunk.friendlyName,
      }
    });
  } catch (error) {
    console.error('Error creating assistant trunk:', error);
    res.status(500).json({ success: false, message: 'Failed to create assistant trunk' });
  }
});

// Helper functions (copied from twilio-admin.js)
function classifyUsage(row, userTrunkSid) {
  const { voiceUrl, voiceApplicationSid, trunkSid } = row;

  if (isTwilioDemoUrl(voiceUrl)) return 'demo';
  if (trunkSid === userTrunkSid) return 'ours';
  if (trunkSid) return 'trunk';
  if (voiceApplicationSid) return 'app';
  if (voiceUrl && !isTwilioDemoUrl(voiceUrl)) return 'foreign';
  return 'unused';
}

function isTwilioDemoUrl(url = '') {
  const u = String(url).trim().toLowerCase();
  return u.startsWith('https://demo.twilio.com') || u.startsWith('http://demo.twilio.com');
}

function isStrictlyUnused(n) {
  return n.usage === 'unused';
}

/**
 * Assign a phone number to an assistant
 * POST /api/v1/twilio/user/phone-numbers/assign
 */
twilioUserRouter.post('/phone-numbers/assign', async (req, res) => {
  try {
    const userId = req.user.id;
    const { phoneNumber, assistantId, label } = req.body;

    if (!phoneNumber || !assistantId) {
      return res.status(400).json({ success: false, message: 'Phone number and assistant ID are required' });
    }

    // Find and update, or create if not exists (upsert behavior)
    // We match by number. We also ensure it belongs to the user if it exists?
    // If it doesn't exist, we create it.
    // Wait, normally PhoneNumber should exist if it was purchased or synchronized.
    // But the frontend code used upsert.

    const updated = await PhoneNumber.findOneAndUpdate(
      { number: phoneNumber },
      {
        user_id: userId,
        number: phoneNumber,
        inbound_assistant_id: assistantId,
        label: label || `Assistant ${assistantId}`,
        status: 'active',
        webhook_status: 'configured', // Assume we configure it
        updated_at: new Date()
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    res.json({ success: true, message: 'Phone number assigned successfully', data: updated });

  } catch (error) {
    console.error('Error assigning phone number:', error);
    res.status(500).json({ success: false, message: 'Failed to assign phone number' });
  }
});

/**
 * Check if usage is unused for our webhook
 */
function isUnusedForOurWebhook(n, userTrunkSid) {
  return n.usage === 'unused' || (n.usage === 'trunk' && n.trunkSid !== userTrunkSid);
}

