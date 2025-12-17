import { PhoneNumber, Assistant, SmsMessage, UserTwilioCredential } from '../models/index.js';

class SMSDatabaseService {
  constructor() {
    // No initialization needed for Mongoose models
  }

  /**
   * Get assistant configuration by phone number
   */
  async getAssistantByPhoneNumber(phoneNumber) {
    try {
      console.log(`Querying database for phone number: ${phoneNumber}`);

      const phoneDoc = await PhoneNumber.findOne({ number: phoneNumber, status: 'active' });

      if (!phoneDoc) {
        console.error('Error fetching assistant by phone number: Phone number not found');
        return null;
      }

      if (!phoneDoc.inbound_assistant_id) {
        return null;
      }

      const assistant = await Assistant.findById(phoneDoc.inbound_assistant_id);

      console.log('Database query result:', assistant);
      return assistant;
    } catch (error) {
      console.error('Exception in getAssistantByPhoneNumber:', error);
      return null;
    }
  }

  /**
   * Check if this is a new conversation or ongoing
   * Returns true if assistant hasn't sent any messages in the last 3 hours
   */
  async isNewConversation(userPhoneNumber, assistantId) {
    try {
      const ASSISTANT_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hours in milliseconds

      console.log(`Checking if assistant has sent messages recently for user phone: ${userPhoneNumber}, assistant: ${assistantId}`);

      // Get the assistant's phone number (the number users text to)
      const assistantPhoneData = await PhoneNumber.findOne({ inbound_assistant_id: assistantId, status: 'active' });

      if (!assistantPhoneData) {
        console.log('Could not find assistant phone number - treating as new conversation');
        return true;
      }

      const assistantPhoneNumber = assistantPhoneData.number;
      console.log(`Assistant phone number: ${assistantPhoneNumber}`);

      // Check if assistant has sent any messages to this user in the last 3 hours
      const threeHoursAgo = new Date(Date.now() - ASSISTANT_TIMEOUT);

      const lastMessage = await SmsMessage.findOne({
        from_number: assistantPhoneNumber,
        to_number: userPhoneNumber,
        direction: 'outbound',
        date_created: { $gte: threeHoursAgo }
      }).sort({ date_created: -1 });

      if (!lastMessage) {
        console.log('No assistant messages found in last 3 hours - new conversation, will send first message');
        return true; // No assistant messages in last 3 hours = new conversation
      }

      // Assistant has sent a message recently
      const lastAssistantMessageTime = new Date(lastMessage.date_created).getTime();
      const now = Date.now();
      const timeDiff = now - lastAssistantMessageTime;

      console.log(`Last assistant message time: ${lastMessage.date_created}, Time diff: ${timeDiff}ms, Timeout: ${ASSISTANT_TIMEOUT}ms`);
      console.log('Assistant has sent messages recently - ongoing conversation, will generate AI response');

      return false; // Assistant has sent messages recently = ongoing conversation
    } catch (error) {
      console.error('Exception in isNewConversation:', error);
      return true; // Default to new conversation on error
    }
  }

  /**
   * Get conversation history for context
   */
  async getConversationHistory(userPhoneNumber, assistantId, limit = 10) {
    try {
      console.log(`Getting conversation history for user phone: ${userPhoneNumber}, assistant: ${assistantId}, limit: ${limit}`);

      // Get the assistant's phone number (the number users text to)
      const assistantPhoneData = await PhoneNumber.findOne({ inbound_assistant_id: assistantId, status: 'active' });

      if (!assistantPhoneData) {
        console.log('Could not find assistant phone number - returning empty history');
        return [];
      }

      const assistantPhoneNumber = assistantPhoneData.number;
      console.log(`Assistant phone number: ${assistantPhoneNumber}`);

      // Get messages between user and assistant (both directions)
      // .or(`and(to_number.eq.${userPhoneNumber},from_number.eq.${assistantPhoneNumber}),and(to_number.eq.${assistantPhoneNumber},from_number.eq.${userPhoneNumber})`)

      const messages = await SmsMessage.find({
        $or: [
          { to_number: userPhoneNumber, from_number: assistantPhoneNumber },
          { to_number: assistantPhoneNumber, from_number: userPhoneNumber }
        ]
      })
        .sort({ date_created: -1 })
        .limit(limit);

      console.log(`Found ${messages.length} conversation history messages between user and assistant`);
      return messages;
    } catch (error) {
      console.error('Exception in getConversationHistory:', error);
      return [];
    }
  }

  /**
   * Save incoming SMS message
   */
  async saveIncomingSMS(smsData) {
    try {
      console.log('💾 SMS DATABASE SERVICE: Saving incoming SMS:', {
        messageSid: smsData.messageSid,
        toNumber: smsData.toNumber,
        fromNumber: smsData.fromNumber,
        messageBody: smsData.messageBody?.substring(0, 50) + '...',
        userId: smsData.userId
      });

      const newMessage = new SmsMessage({
        message_sid: smsData.messageSid,
        to_number: smsData.toNumber,
        from_number: smsData.fromNumber,
        body: smsData.messageBody,
        direction: 'inbound',
        status: 'received',
        date_created: new Date(),
        date_updated: new Date(),
        user_id: smsData.userId
      });

      const savedMessage = await newMessage.save();

      console.log('✅ SMS saved successfully:', {
        messageSid: savedMessage.message_sid,
        id: savedMessage._id,
        direction: savedMessage.direction
      });

      return savedMessage;
    } catch (error) {
      console.error('Exception in saveIncomingSMS:', error);
      return null;
    }
  }

  /**
   * Save outgoing SMS message
   */
  async saveOutgoingSMS(smsData) {
    try {
      const newMessage = new SmsMessage({
        message_sid: smsData.messageSid,
        to_number: smsData.toNumber,
        from_number: smsData.fromNumber,
        body: smsData.messageBody,
        direction: 'outbound',
        status: smsData.status || 'sent',
        date_created: new Date(),
        date_updated: new Date(),
        user_id: smsData.userId
      });

      const savedMessage = await newMessage.save();
      return savedMessage;
    } catch (error) {
      console.error('Exception in saveOutgoingSMS:', error);
      return null;
    }
  }

  /**
   * Get user ID from assistant ID
   */
  async getUserIdFromAssistant(assistantId) {
    try {
      const assistant = await Assistant.findById(assistantId).select('user_id');
      return assistant?.user_id || null;
    } catch (error) {
      console.error('Exception in getUserIdFromAssistant:', error);
      return null;
    }
  }

  /**
   * Get user Twilio credentials
   * Added to support refactoring of SMSAssistantService
   */
  async getUserTwilioCredentials(userId) {
    try {
      const credentials = await UserTwilioCredential.findOne({ user_id: userId, is_active: true });
      return credentials;
    } catch (error) {
      console.error('Error fetching Twilio credentials:', error);
      throw error;
    }
  }
}

export { SMSDatabaseService };
