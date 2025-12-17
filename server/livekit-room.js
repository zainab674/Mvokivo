// server/livekit-room.js
import express from 'express';
import { AccessToken, RoomServiceClient, AgentDispatchClient } from 'livekit-server-sdk';
import { Assistant } from './models/index.js';

export const livekitRoomRouter = express.Router();

/**
 * Generate Access Token for LiveKit
 * POST /api/v1/livekit/create-token
 */
livekitRoomRouter.post('/create-token', async (req, res) => {
  try {
    const { roomName, participantName, identity: requestedIdentity, permissions, metadata = {}, dispatch, roomConfig } = req.body;

    // Use provided room name or generate one
    const room = roomName || `room-${Math.random().toString(36).slice(2, 8)}`;
    const identity = participantName || requestedIdentity || `user-${Math.random().toString(36).slice(2, 8)}`;

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.LIVEKIT_HOST;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'LiveKit credentials are not configured' });
    }

    console.log('Creating LiveKit token:', { room, identity, hasDispatch: !!dispatch });

    // If dispatch is requested, create room with agent configuration
    if (dispatch || roomConfig) {
      const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

      try {
        // Prepare room metadata with assistant configuration
        const assistantId = metadata.assistantId || dispatch?.metadata?.assistantId;
        const roomMetadata = {
          ...metadata,
          assistantId,
          source: 'web',
          callType: 'web',
          agentName: dispatch?.agentName || 'ai',
        };

        // Create room with agent dispatch metadata
        await roomService.createRoom({
          name: room,
          metadata: JSON.stringify(roomMetadata),
        });

        console.log(`✅ Room '${room}' created with agent dispatch metadata`);

        // Wait a moment for room to be fully created before dispatching
        await new Promise(resolve => setTimeout(resolve, 500));

        // Dispatch agent using AgentDispatchClient
        try {
          // Convert WebSocket URL to HTTP/HTTPS for API calls
          let httpUrl = livekitUrl;
          if (livekitUrl.startsWith('wss://')) {
            httpUrl = livekitUrl.replace('wss://', 'https://');
          } else if (livekitUrl.startsWith('ws://')) {
            httpUrl = livekitUrl.replace('ws://', 'http://');
          }

          console.log(`🤖 Dispatching agent to room '${room}' via ${httpUrl}`);

          const agentDispatchClient = new AgentDispatchClient(
            httpUrl,
            apiKey,
            apiSecret
          );

          const agentName = dispatch?.agentName || 'ai';
          const agentMetadata = {
            agentId: assistantId,
            callType: 'web',
            roomName: room,
            source: 'web',
            ...(dispatch?.metadata || {}),
          };

          console.log(`📤 Dispatching agent with params:`, {
            room,
            agentName,
            metadata: agentMetadata
          });

          const dispatchResult = await agentDispatchClient.createDispatch(
            room,
            agentName,
            {
              metadata: JSON.stringify(agentMetadata),
            }
          );

          console.log('✅ Agent dispatched successfully:', JSON.stringify(dispatchResult, null, 2));

        } catch (dispatchError) {
          console.error('❌ Failed to dispatch agent:', dispatchError.message);
          // Continue anyway - user can still connect
        }

      } catch (roomError) {
        console.warn(`Room creation note: ${roomError.message}`);
      }
    }

    const grant = {
      room: room,
      roomJoin: true,
      canPublish: permissions?.canPublish ?? true,
      canSubscribe: permissions?.canSubscribe ?? true,
      canPublishData: permissions?.canPublishData ?? true,
    };

    const at = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: identity,
      metadata: JSON.stringify(metadata),
    });

    at.addGrant(grant);
    const token = await at.toJwt();

    res.json({ token, roomName: room, participantName: identity });
  } catch (error) {
    console.error('Error creating token:', error);
    res.status(500).json({ error: 'Failed to create token' });
  }
});

/**
 * Create LiveKit room for outbound call
 * POST /api/v1/livekit/room/:roomName
 */
livekitRoomRouter.post('/room/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    const { assistantId, phoneNumber, campaignId, campaignPrompt, contactInfo } = req.body;

    console.log('Creating LiveKit room for outbound call:', {
      roomName,
      assistantId,
      phoneNumber,
      campaignId,
      hasCampaignPrompt: !!campaignPrompt,
      contactInfo
    });

    // Get assistant details
    let assistant = null;
    if (assistantId) {
      try {
        assistant = await Assistant.findById(assistantId);
      } catch (error) {
        console.error('Error fetching assistant from Mongoose:', error);
      }
    }

    // Create LiveKit access token
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL;

    if (!apiKey || !apiSecret || !livekitUrl) {
      return res.status(500).json({
        success: false,
        message: 'LiveKit credentials not configured'
      });
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

    res.set('Content-Type', 'text/xml');
    res.send(twiml);

  } catch (error) {
    console.error('Error creating LiveKit room:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create LiveKit room',
      error: error.message
    });
  }
});

/**
 * Dispatch an agent to a LiveKit room
 * POST /api/v1/livekit/dispatch
 */
livekitRoomRouter.post('/dispatch', async (req, res) => {
  try {
    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.LIVEKIT_HOST;

    const { roomName, agentName = 'ai', metadata = {} } = req.body;

    if (!roomName) {
      return res.status(400).json({
        success: false,
        message: 'roomName is required'
      });
    }

    console.log(`Dispatching agent '${agentName}' to room '${roomName}'`);

    // Create or update room with agent dispatch metadata
    const roomService = new RoomServiceClient(livekitUrl, apiKey, apiSecret);

    try {
      // Update room metadata to include agent dispatch information
      await roomService.updateRoomMetadata(roomName, JSON.stringify({
        agentName,
        ...metadata,
        source: 'web',
        dispatched: true,
      }));

      console.log(`Agent '${agentName}' dispatched to room '${roomName}'`);

      res.json({
        success: true,
        message: `Agent ${agentName} dispatched to room ${roomName}`,
        roomName,
        agentName,
      });
    } catch (error) {
      // If room doesn't exist, create it
      await roomService.createRoom({
        name: roomName,
        metadata: JSON.stringify({
          agentName,
          ...metadata,
          source: 'web',
          dispatched: true,
        }),
      });

      console.log(`Created new room '${roomName}' and dispatched agent '${agentName}'`);

      res.json({
        success: true,
        message: `Room created and agent ${agentName} dispatched`,
        roomName,
        agentName,
      });
    }

  } catch (err) {
    console.error('Error dispatching agent:', err);
    res.status(500).json({
      success: false,
      message: 'Failed to dispatch agent',
      error: err.message
    });
  }
});

/**
 * Get room status
 * GET /api/v1/livekit/room/:roomName/status
 */
livekitRoomRouter.get('/room/:roomName/status', async (req, res) => {
  try {
    const { roomName } = req.params;

    // This would typically check with LiveKit API for room status
    // For now, just return a basic response
    res.json({
      success: true,
      roomName,
      status: 'active'
    });

  } catch (error) {
    console.error('Error getting room status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get room status'
    });
  }
});
