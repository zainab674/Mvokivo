import 'dotenv/config';
import express from 'express';
import twilio from 'twilio';
import { SMSAssistantService } from './services/sms-assistant-service.js';
import { SMSDatabaseService } from './services/sms-database-service.js';
import { SMSAIService } from './services/sms-ai-service.js';
import { PhoneNumber, SmsMessage } from './models/index.js';
import { authenticateToken } from './utils/auth.js';

// Initialize SMS services
const smsDatabaseService = new SMSDatabaseService();
const smsAIService = new SMSAIService();
const smsAssistantService = new SMSAssistantService(smsDatabaseService, smsAIService, null); // Pass null since we'll create client per request

const router = express.Router();

// Helper to differentiate between protected API routes and public webhooks/callbacks
// We will mount protected routes separately or apply auth selectively

// --- Protected Routes (Authenticated Users) ---

/**
 * Get all SMS messages for the authenticated user
 * GET /api/v1/twilio/sms/messages
 */
router.get('/messages', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 100 } = req.query;

    const messages = await SmsMessage.find({ user_id: userId })
      .sort({ date_created: -1 })
      .limit(parseInt(limit));

    // Map basic fields
    const mappedMessages = messages.map(msg => ({
      messageSid: msg.message_sid,
      to: msg.to_number,
      from: msg.from_number,
      body: msg.body,
      direction: msg.direction,
      status: msg.status,
      dateCreated: msg.date_created,
      dateSent: msg.date_sent,
      dateUpdated: msg.date_updated,
      errorCode: msg.error_code,
      errorMessage: msg.error_message,
      // Add additional fields if schema supports them
      user_id: msg.user_id
    }));

    res.json({ success: true, messages: mappedMessages });
  } catch (error) {
    console.error('Error fetching user SMS messages:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch messages' });
  }
});

/**
 * Send SMS message using Twilio (Authenticated)
 * POST /api/v1/twilio/sms/send
 */
router.post('/send', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const {
      accountSid,
      authToken,
      to,
      from,
      body,
      conversationId
    } = req.body;

    if (!accountSid || !authToken || !to || !body) {
      return res.status(400).json({
        success: false,
        message: 'accountSid, authToken, to, and body are required'
      });
    }

    // Initialize Twilio client
    const client = twilio(accountSid, authToken);

    // Get user's actual Twilio phone number from database if not provided or valid
    let fromNumber = from;
    if (!from || from === '+1234567890' || from === '') {
      try {
        const phoneNumber = await PhoneNumber.findOne({ user_id: userId, status: 'active' }).select('number');

        if (phoneNumber) {
          fromNumber = phoneNumber.number;
          console.log('Using phone number from database:', fromNumber);
        } else {
          // Fallback: get first available phone number from Twilio
          const twilioNumbers = await client.incomingPhoneNumbers.list({ limit: 1 });
          if (twilioNumbers.length > 0) {
            fromNumber = twilioNumbers[0].phoneNumber;
            console.log('Using first Twilio phone number:', fromNumber);
          }
        }
      } catch (dbError) {
        console.error('Error fetching phone number from database:', dbError);
      }
    }

    // Send SMS message
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to,
      ...((process.env.NGROK_URL || (process.env.BACKEND_URL && !process.env.BACKEND_URL.includes('localhost'))) && {
        statusCallback: `${process.env.NGROK_URL || process.env.BACKEND_URL}/api/v1/twilio/sms/status-callback`,
        statusCallbackEvent: ['sent', 'delivered', 'failed', 'undelivered']
      })
    });

    // Store message in database
    try {
      await SmsMessage.create({
        message_sid: message.sid,
        user_id: userId,
        to_number: to,
        from_number: fromNumber,
        body,
        direction: 'outbound',
        status: message.status,
        date_created: message.dateCreated || new Date(),
        date_sent: message.dateSent || null,
        date_updated: message.dateUpdated || new Date()
      });
    } catch (dbError) {
      console.error('Database error storing SMS message:', dbError);
    }

    res.json({
      success: true,
      message: 'SMS sent successfully',
      data: {
        messageSid: message.sid,
        status: message.status,
        to: message.to,
        from: message.from,
        body: message.body,
        dateCreated: message.dateCreated
      }
    });

  } catch (error) {
    console.error('Error sending SMS:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to send SMS'
    });
  }
});


/**
 * Get SMS conversation history (Authenticated, by ID)
 * GET /api/v1/twilio/sms/conversation/:conversationId
 */
router.get('/conversation/:conversationId', authenticateToken, async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { accountSid, authToken } = req.query; // Still allow query params for credentials if needed, or use stored ones

    // If query params are missing, try to get from user's stored credentials?
    // For now, keep existing logic but allow it to fail if client doesn't send them
    // Or we could fetch user credentials here.
    if (!accountSid || !authToken) {
      // Only return DB messages if no credentials provided?
      // Or fetch user credentials from DB.
      // Let's stick to requiring them for now as per original code, or allow fetching from DB messages only.
      // Actually, the original code initialized Twilio client, implying it might fetch from Twilio?
      // Ah, original code fetched from DB only: `await SmsMessage.find(...)`
      // So `client` initialization was actually UNUSED in the original code for GET!
      // No, `client` was just instantiated.
      // I will simplify and just return from DB.
    }

    const number = conversationId.replace('conv_', '');

    // Get messages from database for this phone number
    const messages = await SmsMessage.find({
      $or: [
        { to_number: number },
        { from_number: number }
      ]
    })
      .sort({ date_created: -1 })
      .limit(50);

    res.json({
      success: true,
      data: messages.map(msg => ({
        messageSid: msg.message_sid,
        to: msg.to_number,
        from: msg.from_number,
        body: msg.body,
        direction: msg.direction,
        status: msg.status,
        dateCreated: msg.date_created,
        dateSent: msg.date_sent,
        dateUpdated: msg.date_updated,
        errorCode: msg.error_code,
        errorMessage: msg.error_message
      }))
    });

  } catch (error) {
    console.error('Error fetching SMS messages:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch SMS messages'
    });
  }
});


// --- Public/Webhook Routes (Unauthenticated) ---

/**
 * Webhook endpoint for incoming SMS messages
 * POST /api/v1/twilio/sms/webhook
 */
router.post('/webhook', async (req, res) => {
  try {
    const {
      MessageSid,
      From,
      To,
      Body,
      DateCreated,
      DateSent,
      DateUpdated
    } = req.body;

    console.log('🔔 SMS WEBHOOK TRIGGERED:', { MessageSid, From });

    // Process the SMS using our new SMS assistant service
    try {
      await smsAssistantService.processIncomingSMS({
        fromNumber: From,
        toNumber: To,
        messageBody: Body,
        messageSid: MessageSid
      });
      res.status(200).send('SMS processed');
    } catch (error) {
      console.error('Error processing SMS:', error);
      res.status(500).send('Error processing SMS');
    }

  } catch (error) {
    console.error('Error processing SMS webhook:', error);
    res.status(500).json({ success: false, message: 'Failed to process SMS webhook' });
  }
});

/**
 * Status callback endpoint for SMS delivery status
 * POST /api/v1/twilio/sms/status-callback
 */
router.post('/status-callback', async (req, res) => {
  try {
    const {
      MessageSid,
      MessageStatus,
      ErrorCode,
      ErrorMessage,
      DateSent,
      DateUpdated
    } = req.body;

    // Update message status in database
    try {
      await SmsMessage.findOneAndUpdate(
        { message_sid: MessageSid },
        {
          status: MessageStatus,
          error_code: ErrorCode,
          error_message: ErrorMessage,
          date_sent: DateSent ? new Date(DateSent) : undefined,
          date_updated: DateUpdated ? new Date(DateUpdated) : new Date()
        }
      );
    } catch (dbError) {
      console.error('Database error updating SMS message status:', dbError);
    }

    res.type('text/xml');
    res.send('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');

  } catch (error) {
    console.error('Error processing SMS status callback:', error);
    res.status(500).json({ success: false, message: 'Failed to process status callback' });
  }
});

/**
 * GET /api/v1/twilio/sms/test
 */
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'SMS router is working!' });
});

export { router as twilioSmsRouter };
