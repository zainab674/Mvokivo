import express from 'express';
import fetch from 'node-fetch';
import { authenticateToken } from '../utils/auth.js';

const router = express.Router();

const UNREAL_API_URL = "https://api.v8.unrealspeech.com/stream";

router.post('/preview', authenticateToken, async (req, res) => {
    try {
        const { text, voiceId } = req.body;
        const UNREAL_API_KEY = process.env.UNREAL_API_KEY;

        console.log(`[TTS Preview] Request for voice: ${voiceId}`);

        if (!text || !voiceId) {
            return res.status(400).json({ success: false, message: 'Text and voiceId are required' });
        }

        if (!UNREAL_API_KEY) {
            console.error('[TTS Preview] UNREAL_API_KEY missing from process.env');
            return res.status(500).json({ success: false, message: 'UNREAL_API_KEY not configured on server' });
        }

        const payload = {
            Text: text,
            VoiceId: voiceId,
            Codec: 'libmp3lame',
        };

        const response = await fetch(UNREAL_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${UNREAL_API_KEY}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('UnrealSpeech API error:', errorText);
            return res.status(response.status).json({ success: false, message: 'Failed to generate speech preview' });
        }

        // Forward the audio stream
        res.setHeader('Content-Type', 'audio/mpeg');
        response.body.pipe(res);

    } catch (error) {
        console.error('TTS Preview Error:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

export default router;
