import express from 'express';
import { authenticateToken as protect } from '../utils/auth.js';
import { User, UserEmailCredential } from '../models/index.js';

const router = express.Router();

// GET /api/v1/integrations
router.get('/', protect, async (req, res) => {
    try {
        const credentials = await UserEmailCredential.find({ user_id: req.user.id });
        // MananUltratalk might have other integrations too, but for now we focus on email
        res.json({
            email: credentials || [],
            calendar: [] // Stub or fetch from UserCalendarCredential if needed
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

// POST /api/v1/integrations/email
router.post('/email', protect, async (req, res) => {
    try {
        const { provider, smtpHost, smtpPort, smtpUser, smtpPass, imapHost, imapPort, imapUser, imapPass, email } = req.body;

        const existing = await UserEmailCredential.findOne({ user_id: req.user.id, email: email });

        if (existing) {
            existing.provider = provider;
            existing.smtpHost = smtpHost;
            existing.smtpPort = smtpPort;
            existing.smtpUser = smtpUser;
            existing.smtpPass = smtpPass;
            existing.imapHost = imapHost;
            existing.imapPort = imapPort;
            existing.imapUser = imapUser;
            existing.imapPass = imapPass;
            existing.isActive = true;
            existing.updated_at = Date.now();
            await existing.save();
            return res.json(await UserEmailCredential.find({ user_id: req.user.id }));
        }

        const newIntegration = new UserEmailCredential({
            user_id: req.user.id,
            provider,
            smtpHost,
            smtpPort,
            smtpUser,
            smtpPass,
            imapHost,
            imapPort,
            imapUser,
            imapPass,
            email,
            isActive: true
        });

        await newIntegration.save();
        res.json(await UserEmailCredential.find({ user_id: req.user.id }));

    } catch (error) {
        console.error('Error in POST /email:', error);
        res.status(500).json({ message: 'Server Error during email setup', error: error.message });
    }
});

// DELETE /api/v1/integrations/email/:email
router.delete('/email/:email', protect, async (req, res) => {
    try {
        await UserEmailCredential.findOneAndDelete({ user_id: req.user.id, email: req.params.email });
        res.json(await UserEmailCredential.find({ user_id: req.user.id }));
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
});

export default router;
