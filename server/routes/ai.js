import express from 'express';
import OpenAI from 'openai';
import dotenv from 'dotenv';
import { authenticateToken } from '../utils/auth.js';

dotenv.config();

const router = express.Router();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

/**
 * @route POST /api/v1/ai/enhance-text
 * @desc Enhance text using AI
 * @access Private
 */
router.post('/enhance-text', authenticateToken, async (req, res) => {
    try {
        const { text, instruction } = req.body;

        if (!text) {
            return res.status(400).json({ success: false, message: 'Text is required' });
        }

        const response = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [
                {
                    role: "system",
                    content: "You are a helpful assistant that enhances text. Follow the user's instructions to improve the quality, tone, and clarity of the provided text. Return ONLY the enhanced text without any preamble or conversational filler."
                },
                {
                    role: "user",
                    content: `Instruction: ${instruction || "Improve this text."}\n\nText:\n${text}`
                }
            ],
            temperature: 0.7,
            max_tokens: 1000
        });

        const enhancedText = response.choices[0].message.content.trim();

        res.json({
            success: true,
            content: enhancedText
        });

    } catch (error) {
        console.error('Error enhancing text:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to enhance text',
            error: error.message
        });
    }
});

export default router;
