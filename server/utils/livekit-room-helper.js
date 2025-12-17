// server/utils/livekit-room-helper.js
import { AccessToken, RoomServiceClient } from 'livekit-server-sdk';
import { Assistant } from '../models/index.js';

/**
 * Create LiveKit room and return TwiML directly
 * This avoids making internal HTTP requests
 */
export async function createLiveKitRoomTwiml({
  roomName,
  assistantId,
  phoneNumber,
  campaignId,
  campaignPrompt,
  contactInfo
}) {
  try {
    console.log('Creating LiveKit room for outbound call:', {
      roomName,
      assistantId,
      phoneNumber,
      campaignId,
      hasCampaignPrompt: !!campaignPrompt,
      contactInfo
    });

    // Get assistant details
    // Mongoose: findById or findOne({ id: assistantId }) depending on if ID is _id or custom id
    // In models/index.js Assistant has no 'id' field defined explicitly, so likely uses _id.
    // However, if the system uses custom IDs (string), I should check.
    // The previous code used .eq('id', assistantId).
    // If assistantId is a Mongo _id, use findById. If it's a custom string id, use findOne({ id: ... }).
    // Looking at schema: user_id is String, but there isn't an explicit 'id' field in Assistant schema.
    // However, in `twilio-sip.js` refactor I assumed _id.
    // But `phoneNumber` schema has `id: { type: String, required: true, unique: true }`.
    // Let's assume Assistant uses _id unless proven otherwise.
    // If the migration kept IDs as strings, then we might use _id if we forced it, or a custom id field.
    // The schema I saw in models/index.js: `const assistantSchema = new mongoose.Schema({ user_id: { type: String... } ... })`.
    // It does NOT have an `id` field. So it uses default `_id`.
    // But assuming we are using new Mongoose IDs (ObjectIds), then `findById` is correct.
    // However, if the frontend is sending UUIDs, we might need to handle that.
    // For now, I will try `findById` and if that fails (invalid format), I'll check if I should search differently.
    // But safely: `Assistant.findOne({ _id: assistantId })` is safest if it's an ObjectId.
    // If assistantId is a string that is NOT an ObjectId, findById might throw or return null.

    let assistant = null;
    if (assistantId) {
      try {
        assistant = await Assistant.findById(assistantId);
      } catch (e) {
        console.warn(`Assistant ID ${assistantId} might not be a valid ObjectId:`, e.message);
      }
    }

    // Create LiveKit access token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_HOST || process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      throw new Error('LiveKit credentials not configured');
    }

    // Create room with agent dispatch using LiveKit API
    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    try {
      // Create room with metadata
      await roomService.createRoom({
        name: roomName,
        metadata: JSON.stringify({
          assistantId,
          phoneNumber,
          campaignId,
          campaignPrompt: campaignPrompt || '',
          contactInfo: contactInfo || {},
          source: 'outbound',
          callType: 'campaign'
        })
      });

      console.log(`Created LiveKit room ${roomName}`);
    } catch (error) {
      console.error('Error creating LiveKit room:', error);
      // Continue anyway - room might already exist
    }

    const grant = {
      room: roomName,
      roomJoin: true,
      canPublish: true,
      canPublishData: true,
      canSubscribe: true,
    };

    // Prepare enhanced metadata with campaign information
    const participantMetadata = {
      assistantId,
      phoneNumber,
      campaignId,
      campaignPrompt: campaignPrompt || '',
      contactInfo: contactInfo || {},
      source: 'outbound',
      callType: 'campaign'
    };

    const at = new AccessToken(apiKey, apiSecret, {
      identity: `outbound-${phoneNumber}`,
      metadata: JSON.stringify(participantMetadata),
    });
    at.addGrant(grant);
    const jwt = await at.toJwt();

    // Return TwiML for Twilio to connect to LiveKit room
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Connect>
    <Room participantIdentity="outbound-${phoneNumber}" roomName="${roomName}">
      <Parameter name="assistantId" value="${assistantId || ''}"/>
      <Parameter name="phoneNumber" value="${phoneNumber}"/>
      <Parameter name="campaignId" value="${campaignId || ''}"/>
      <Parameter name="campaignPrompt" value="${(campaignPrompt || '').replace(/"/g, '&quot;')}"/>
      <Parameter name="contactInfo" value="${JSON.stringify(contactInfo || {}).replace(/"/g, '&quot;')}"/>
      <Parameter name="source" value="outbound"/>
      <Parameter name="callType" value="campaign"/>
    </Room>
  </Connect>
</Response>`;

    return twiml;

  } catch (error) {
    console.error('Error creating LiveKit room:', error);
    throw error;
  }
}
