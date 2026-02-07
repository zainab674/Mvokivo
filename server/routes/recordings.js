import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import { UserTwilioCredential } from '../models/index.js';
import { getCallRecordingInfo } from '../twilio-trunk-service.js';

const router = express.Router();

/**
 * Get recording information for a call (Bearer Auth)
 * GET /api/v1/calls/:callSid/recordings
 */
router.get('/:callSid/recordings', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { callSid } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Access token required' });
        }

        if (!callSid) {
            return res.status(400).json({ success: false, message: 'callSid is required' });
        }

        // Fetch active Twilio credentials for this user
        const credentials = await UserTwilioCredential.findOne({
            user_id: userId,
            is_active: true
        });

        if (!credentials) {
            console.error(`No active Twilio credentials found for user: ${userId}`);
            return res.status(400).json({
                success: false,
                message: 'No active Twilio credentials found. Please configure your Twilio settings.'
            });
        }

        const result = await getCallRecordingInfo({
            accountSid: credentials.account_sid,
            authToken: credentials.auth_token,
            callSid
        });

        res.json(result);
    } catch (error) {
        console.error('Error getting call recording info:', error);
        res.status(500).json({
            success: false,
            message: error?.message || 'Failed to get call recording info'
        });
    }
});

/**
 * Proxy recording audio from Twilio (Bearer Auth)
 * GET /api/v1/calls/recording/:recordingSid/audio
 */
router.get('/recording/:recordingSid/audio', authenticateToken, async (req, res) => {
    try {
        const userId = req.user?.id;
        const { recordingSid } = req.params;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'Access token required' });
        }

        if (!recordingSid) {
            return res.status(400).json({ success: false, message: 'recordingSid is required' });
        }

        // Fetch active Twilio credentials for this user
        const credentials = await UserTwilioCredential.findOne({
            user_id: userId,
            is_active: true
        });

        if (!credentials) {
            return res.status(400).json({
                success: false,
                message: 'No active Twilio credentials found'
            });
        }

        const accountSid = credentials.account_sid;
        const authToken = credentials.auth_token;

        // Twilio REST API URL
        const recordingUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Recordings/${recordingSid}`;

        console.log(`Proxying audio for recording ${recordingSid} for user ${userId}`);

        // Make authenticated request to Twilio
        const response = await fetch(recordingUrl, {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
                'Accept': 'audio/wav'
            }
        });

        if (!response.ok) {
            console.error('Failed to fetch recording from Twilio:', response.status, response.statusText);
            return res.status(response.status).json({
                success: false,
                message: `Failed to fetch recording: ${response.statusText}`
            });
        }

        const audioBuffer = await response.arrayBuffer();

        // Set streaming headers
        res.setHeader('Content-Type', 'audio/wav');
        res.setHeader('Content-Length', audioBuffer.byteLength);
        res.setHeader('Accept-Ranges', 'bytes');
        res.setHeader('Cache-Control', 'public, max-age=3600');

        res.send(Buffer.from(audioBuffer));
    } catch (error) {
        console.error('Error proxying recording audio:', error);
        res.status(500).json({
            success: false,
            message: error?.message || 'Internal server error'
        });
    }
});

export default router;
