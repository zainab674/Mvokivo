import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import { UserWhatsAppCredential } from '../models/index.js';

const router = express.Router();

/**
 * Get all WhatsApp credentials for the current user
 * GET /api/v1/whatsapp/credentials
 */
router.get('/credentials', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const credentials = await UserWhatsAppCredential.find({ user_id: userId }).sort({ created_at: -1 });

        // Map _id to id
        const mapped = credentials.map(c => ({
            id: c._id,
            user_id: c.user_id,
            whatsapp_number: c.whatsapp_number,
            whatsapp_key: c.whatsapp_key,
            label: c.label,
            is_active: c.is_active,
            created_at: c.created_at,
            updated_at: c.updated_at
        }));

        res.json(mapped);
    } catch (error) {
        console.error('Error fetching WhatsApp credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
    }
});

/**
 * Get active WhatsApp credentials
 * GET /api/v1/whatsapp/credentials/active
 */
router.get('/credentials/active', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const credential = await UserWhatsAppCredential.findOne({ user_id: userId, is_active: true });

        if (!credential) {
            return res.status(404).json({ success: false, message: 'No active credentials found' });
        }

        res.json({
            id: credential._id,
            user_id: credential.user_id,
            whatsapp_number: credential.whatsapp_number,
            whatsapp_key: credential.whatsapp_key,
            label: credential.label,
            is_active: credential.is_active,
            created_at: credential.created_at,
            updated_at: credential.updated_at
        });
    } catch (error) {
        console.error('Error fetching active WhatsApp credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch credentials' });
    }
});

/**
 * Create new WhatsApp credentials
 * POST /api/v1/whatsapp/credentials
 */
router.post('/credentials', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { whatsapp_number, whatsapp_key, label } = req.body;

        if (!whatsapp_number || !whatsapp_key || !label) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Deactivate existing generic active credentials?
        // Usually we only have one active credential set per provider/user logic
        await UserWhatsAppCredential.updateMany({ user_id: userId }, { is_active: false });

        const newCredential = new UserWhatsAppCredential({
            user_id: userId,
            whatsapp_number,
            whatsapp_key,
            label,
            is_active: true
        });

        await newCredential.save();

        res.status(201).json({
            id: newCredential._id,
            user_id: newCredential.user_id,
            whatsapp_number: newCredential.whatsapp_number,
            whatsapp_key: newCredential.whatsapp_key,
            label: newCredential.label,
            is_active: newCredential.is_active,
            created_at: newCredential.created_at,
            updated_at: newCredential.updated_at
        });

    } catch (error) {
        console.error('Error creating WhatsApp credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to create credentials' });
    }
});

/**
 * Update WhatsApp credentials
 * PUT /api/v1/whatsapp/credentials/:id
 */
router.put('/credentials/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        const credential = await UserWhatsAppCredential.findOneAndUpdate(
            { _id: id, user_id: userId },
            { ...updates, updated_at: new Date() },
            { new: true }
        );

        if (!credential) {
            return res.status(404).json({ success: false, message: 'Credential not found' });
        }

        res.json({
            id: credential._id,
            user_id: credential.user_id,
            whatsapp_number: credential.whatsapp_number,
            whatsapp_key: credential.whatsapp_key,
            label: credential.label,
            is_active: credential.is_active,
            created_at: credential.created_at,
            updated_at: credential.updated_at
        });

    } catch (error) {
        console.error('Error updating WhatsApp credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to update credentials' });
    }
});

/**
 * Delete WhatsApp credentials
 * DELETE /api/v1/whatsapp/credentials/:id
 */
router.delete('/credentials/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await UserWhatsAppCredential.deleteOne({ _id: id, user_id: userId });

        if (result.deletedCount === 0) {
            return res.status(404).json({ success: false, message: 'Credential not found' });
        }

        res.json({ success: true, message: 'Credential deleted' });

    } catch (error) {
        console.error('Error deleting WhatsApp credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to delete credentials' });
    }
});

/**
 * Set active credentials
 * POST /api/v1/whatsapp/credentials/:id/activate
 */
router.post('/credentials/:id/activate', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        // Deactivate all
        await UserWhatsAppCredential.updateMany({ user_id: userId }, { is_active: false });

        // Activate specific
        const credential = await UserWhatsAppCredential.findOneAndUpdate(
            { _id: id, user_id: userId },
            { is_active: true },
            { new: true }
        );

        if (!credential) {
            return res.status(404).json({ success: false, message: 'Credential not found' });
        }

        res.json({
            id: credential._id,
            user_id: credential.user_id,
            whatsapp_number: credential.whatsapp_number,
            whatsapp_key: credential.whatsapp_key,
            label: credential.label,
            is_active: credential.is_active,
            created_at: credential.created_at,
            updated_at: credential.updated_at
        });

    } catch (error) {
        console.error('Error activating WhatsApp credentials:', error);
        res.status(500).json({ success: false, message: 'Failed to activate credentials' });
    }
});

export default router;
