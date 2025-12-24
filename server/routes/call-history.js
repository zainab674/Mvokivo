import express from 'express';
import { authenticateToken } from '../utils/auth.js';
import { CallHistory, Assistant } from '../models/index.js';

const router = express.Router();

// Get call history for the authenticated user
// Get call history for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
    try {
        const userId = req.user.id;
        const { limit = 100 } = req.query;

        // First find all assistants belonging to the user
        const assistants = await Assistant.find({ user_id: userId }).select('id _id');

        // Collect all possible IDs (the custom 'id' field and the hex '_id')
        const assistantIds = [];
        assistants.forEach(a => {
            if (a.id) assistantIds.push(a.id);
            assistantIds.push(a._id.toString());
        });

        if (assistantIds.length === 0) {
            return res.json({ calls: [], total: 0 });
        }

        // Find all call history for these assistants
        let query = { assistant_id: { $in: assistantIds } };

        // Filter by phone number if provided
        if (req.query.phoneNumber) {
            query.phone_number = req.query.phoneNumber;
        }

        // Use created_at for sorting to be compatible with both Mongoose defaults and Python agent data
        let dbQuery = CallHistory.find(query).sort({ created_at: -1 });

        if (limit) {
            dbQuery = dbQuery.limit(parseInt(limit));
        }

        const calls = await dbQuery.exec();

        if (calls.length === 0) {
            return res.json({ calls: [], total: 0 });
        }

        // Extract phone numbers to look up contacts
        const phoneNumbers = [...new Set(calls.map(c => c.phone_number).filter(Boolean))];

        // Find contacts for these phone numbers
        // We match strictly by phone for now
        // Ideally we should also check user_id to ensure we only get this user's contacts
        const contacts = await import('../models/index.js').then(m => m.Contact.find({
            user_id: userId,
            phone: { $in: phoneNumbers }
        }));

        const contactMap = {};
        contacts.forEach(c => {
            if (c.phone) contactMap[c.phone] = c;
        });

        // Format calls
        const formattedCalls = calls.map(call => {
            const contact = contactMap[call.phone_number];

            // Format duration
            let durationStr = '00:00';
            if (call.call_duration) {
                const minutes = Math.floor(call.call_duration / 60);
                const seconds = Math.floor(call.call_duration % 60);
                durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }

            // Parse names from contact if available
            let firstName = '';
            let lastName = '';
            if (contact && contact.name) {
                const parts = contact.name.split(' ');
                firstName = parts[0];
                lastName = parts.slice(1).join(' ');
            } else if (contact) {
                // If contact has separate fields but schema only showed name?
                // Schema has name, email, phone.
                // It does NOT have first_name/last_name in schema I saw.
                // So splitting name is the way.
                firstName = contact.name || 'Unknown';
            }

            return {
                id: call.call_id || call._id, // Use call_id (Vapi ID) if valid, else Mongo ID
                _id: call._id,
                first_name: firstName,
                last_name: lastName,
                phone_number: call.phone_number,
                created_at: call.started_at || call.created_at,
                duration: durationStr,
                type: 'Inbound', // Default for now, as CallHistory doesn't specify
                call_outcome: call.call_status,
                summary: call.summary,
                transcript: call.transcription, // Might be object or string, frontend handles it?
                call_recording: call.recording_url,
                call_sid: call.call_sid || call.call_id,
                analysis: call.sentiment ? { sentiment: call.sentiment } : null
            };
        });

        res.json({
            calls: formattedCalls,
            total: formattedCalls.length
        });
    } catch (error) {
        console.error('Error fetching call history:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Get single call by ID
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user.id;

        // Try to find by call_id first, then _id
        let call = await CallHistory.findOne({ call_id: id });
        if (!call) {
            // Validate if it's a valid ObjectId before querying
            if (id.match(/^[0-9a-fA-F]{24}$/)) {
                call = await CallHistory.findById(id);
            }
        }

        if (!call) {
            return res.status(404).json({ error: 'Call not found' });
        }

        // Verify ownership via assistant
        const assistant = await Assistant.findOne({
            _id: call.assistant_id, // Assistant ID from call
            user_id: userId // Must belong to user
        });

        // Note: call.assistant_id is a String in schema, but might be UUID or ObjectId.
        // Assistant._id is ObjectId generally.
        // If we can't find the assistant owned by this user, deny access.
        // However, if the assistant was deleted, history might persist?
        // Risky check if assistant deleted. 
        // Better: Check if any assistant of user matches.
        // Or simplified: We trust if we found it and we enforce some tenant check?
        // Ideally we should check ownership.

        let hasAccess = false;
        if (assistant) hasAccess = true;
        else {
            // Fallback: Check if user owns the assistant referenced
            // Retrieve assistant by ID and check user_id
            // Since we construct the query above, checking existence is enough IF assistant_id is correct.
            // But if assistant was deleted, we might not find it. 
            // Let's assume for now assistant exists.
            // Or check if the call belongs to a user's assistant is strictly required.
            // If assistant is gone, effectively 'orphan', maybe user should still see it?
            // For strict security, let's assume we need to verify ownership.
            // Let's use the assistants list approach from GET /
            const userAssistants = await Assistant.find({ user_id: userId }).select('id');
            const userAssistantIds = userAssistants.map(a => a.id.toString());
            if (userAssistantIds.includes(call.assistant_id)) {
                hasAccess = true;
            }
        }

        if (!hasAccess) {
            // It's possible the assistant exists but we failed to match ID types?
            // Let's allow if we can verify user ownership another way.
            // For now return 404/403
            return res.status(404).json({ error: 'Call not found or access denied' });
        }

        // Format call
        let contact = null;
        if (call.phone_number) {
            contact = await import('../models/index.js').then(m => m.Contact.findOne({
                user_id: userId,
                phone: call.phone_number
            }));
        }

        let durationStr = '00:00';
        if (call.call_duration) {
            const minutes = Math.floor(call.call_duration / 60);
            const seconds = Math.floor(call.call_duration % 60);
            durationStr = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        let firstName = '';
        let lastName = '';
        if (contact && contact.name) {
            const parts = contact.name.split(' ');
            firstName = parts[0];
            lastName = parts.slice(1).join(' ');
        } else if (contact) {
            firstName = contact.name || 'Unknown';
        }

        const formattedCall = {
            id: call.call_id || call._id,
            first_name: firstName,
            last_name: lastName,
            phone_number: call.phone_number,
            created_at: call.started_at || call.created_at,
            duration: durationStr,
            type: 'Inbound',
            call_outcome: call.call_status,
            summary: call.summary,
            transcript: call.transcription,
            call_recording: call.recording_url,
            call_sid: call.call_sid || call.call_id,
            analysis: call.sentiment ? { sentiment: call.sentiment } : null
        };

        res.json(formattedCall);

    } catch (error) {
        console.error('Error fetching call:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
