import express from 'express';
import { Assistant, PhoneNumber } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';
import { v4 as uuidv4 } from 'uuid';
import { checkPlanLimit } from '../utils/plan-limits.js';

const router = express.Router();

/**
 * Get all assistants for current user
 * GET /api/v1/assistants
 */
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const assistants = await Assistant.find({ user_id: userId }).sort({ created_at: -1 });

        const transformed = assistants.map(a => ({
            ...a.toObject(),
            id: a.id || a._id.toString(),
            description: a.prompt ? a.prompt.substring(0, 100) + '...' : undefined,
            status: 'active'
        }));

        res.json({ success: true, assistants: transformed, total: transformed.length });
    } catch (err) {
        console.error('Error fetching assistants:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch assistants' });
    }
});

/**
 * Get single assistant by ID
 * GET /api/v1/assistants/:id
 */
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const assistant = await Assistant.findOne({ id: id, user_id: userId });

        if (!assistant) {
            // Fallback to check by _id if needed, though we prefer 'id' field
            const byMongoId = await Assistant.findOne({ _id: id, user_id: userId });
            if (byMongoId) {
                // Fetch phone number
                const phoneNumber = await PhoneNumber.findOne({ inbound_assistant_id: byMongoId.id });
                return res.json({ success: true, data: { ...byMongoId.toObject(), phoneNumber: phoneNumber ? phoneNumber.number : null } });
            }
            return res.status(404).json({ success: false, message: 'Assistant not found' });
        }

        // Fetch phone number
        const phoneNumber = await PhoneNumber.findOne({ inbound_assistant_id: assistant.id });

        res.json({ success: true, data: { ...assistant.toObject(), phoneNumber: phoneNumber ? phoneNumber.number : null } });
    } catch (err) {
        console.error('Error fetching assistant:', err);
        res.status(500).json({ success: false, message: 'Failed to fetch assistant' });
    }
});

/**
 * Create assistant
 * POST /api/v1/assistants
 */
router.post('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;

        // Check plan limits
        const limitCheck = await checkPlanLimit(userId, 'assistant');
        if (!limitCheck.allowed) {
            return res.status(403).json({ success: false, message: limitCheck.message });
        }

        const payload = req.body;

        // Ensure ID is generated if not provided
        const newId = payload.id || `asst_${uuidv4().replace(/-/g, '')}`;

        const newAssistant = new Assistant({
            ...payload,
            id: newId,
            user_id: userId,
            created_at: new Date(),
            updated_at: new Date()
        });

        await newAssistant.save();

        res.status(201).json({ success: true, data: { id: newId }, message: 'Assistant created successfully' });
    } catch (err) {
        console.error('Error creating assistant:', err);
        res.status(500).json({ success: false, message: 'Failed to create assistant', error: err.message });
    }
});

/**
 * Update assistant
 * PUT /api/v1/assistants/:id
 */
router.put('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;
        const updates = req.body;

        let assistant = await Assistant.findOne({ id: id, user_id: userId });

        if (!assistant) {
            // Fallback to check by _id if needed
            assistant = await Assistant.findOne({ _id: id, user_id: userId });
            if (!assistant) {
                return res.status(404).json({ success: false, message: 'Assistant not found' });
            }
        }

        Object.assign(assistant, updates);
        assistant.updated_at = new Date();

        await assistant.save();

        res.json({ success: true, data: { id }, message: 'Assistant updated successfully' });
    } catch (err) {
        console.error('Error updating assistant:', err);
        res.status(500).json({ success: false, message: 'Failed to update assistant' });
    }
});

/**
 * Delete assistant
 * DELETE /api/v1/assistants/:id
 */
router.delete('/:id', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const result = await Assistant.deleteOne({ id: id, user_id: userId });

        if (result.deletedCount === 0) {
            // Try mongo ID
            const mongoResult = await Assistant.deleteOne({ _id: id, user_id: userId });
            if (mongoResult.deletedCount === 0) {
                return res.status(404).json({ success: false, message: 'Assistant not found' });
            }
        }

        res.json({ success: true, message: 'Assistant deleted' });
    } catch (err) {
        console.error('Error deleting assistant:', err);
        res.status(500).json({ success: false, message: 'Failed to delete assistant' });
    }
});

export default router;
