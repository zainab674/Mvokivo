import express from 'express';
import { Contact, ContactList } from '../models/index.js';
import { authenticateToken } from '../utils/auth.js';
import { applyTenantFilterFromRequest } from '../utils/applyTenantFilterToQuery.js';

const router = express.Router();

// Apply auth middleware
router.use(authenticateToken);

/**
 * Get all contact lists
 * GET /api/v1/contacts/lists
 */
router.get('/lists', async (req, res) => {
    try {
        const userId = req.user.id;
        let query = ContactList.find({ user_id: userId }).sort({ created_at: -1 });
        applyTenantFilterFromRequest(req, query);

        const lists = await query;
        res.json({ success: true, lists });
    } catch (error) {
        console.error('Error fetching contact lists:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contact lists' });
    }
});

/**
 * Create a contact list
 * POST /api/v1/contacts/lists
 */
router.post('/lists', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name } = req.body;

        if (!name) {
            return res.status(400).json({ success: false, message: 'List name is required' });
        }

        const newList = new ContactList({
            user_id: userId,
            name,
            tenant: req.tenant,
            created_at: new Date(),
            updated_at: new Date()
        });

        await newList.save();

        res.json({ success: true, list: newList });
    } catch (error) {
        console.error('Error creating contact list:', error);
        res.status(500).json({ success: false, message: 'Failed to create contact list' });
    }
});

/**
 * Delete a contact list
 * DELETE /api/v1/contacts/lists/:id
 */
router.delete('/lists/:id', async (req, res) => {
    try {
        const { id } = req.params;

        let query = ContactList.findOne({ _id: id });
        applyTenantFilterFromRequest(req, query);
        const list = await query;

        if (!list) {
            return res.status(404).json({ success: false, message: 'Contact list not found' });
        }

        // Check if used by any contacts? Usually good to check or cascade delete.
        // Ideally we should delete contacts in this list or unset their list_id.
        // For now, let's just delete the list and let contacts be orphan or handle query side.
        // Or better: update contacts to remove list_id

        await Contact.updateMany({ list_id: id }, { $unset: { list_id: "" } });
        await ContactList.deleteOne({ _id: id });

        res.json({ success: true, message: 'Contact list deleted successfully' });
    } catch (error) {
        console.error('Error deleting contact list:', error);
        res.status(500).json({ success: false, message: 'Failed to delete contact list' });
    }
});

/**
 * Get all contacts
 * GET /api/v1/contacts
 */
router.get('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { listId, page = 1, limit = 50, search } = req.query;

        let query = Contact.find({ user_id: userId });
        applyTenantFilterFromRequest(req, query);

        if (listId) {
            query.where('list_id', listId);
        }

        if (search) {
            query.or([
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { phone: { $regex: search, $options: 'i' } }
            ]);
        }

        // Pagination
        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Get total count
        const totalQuery = Contact.find(query.getFilter());
        // Mongoose query filter object can be reused
        const total = await Contact.countDocuments(totalQuery.getFilter());

        // Execute query
        const contacts = await query.sort({ created_at: -1 }).skip(skip).limit(parseInt(limit));

        res.json({
            success: true,
            contacts,
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit))
        });
    } catch (error) {
        console.error('Error fetching contacts:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch contacts' });
    }
});

/**
 * Create a new contact
 * POST /api/v1/contacts
 */
router.post('/', async (req, res) => {
    try {
        const userId = req.user.id;
        const { name, email, phone, listId } = req.body;

        // Basic validation
        if (!name && !email && !phone) {
            return res.status(400).json({ success: false, message: 'At least one contact detail is required' });
        }

        const newContact = new Contact({
            user_id: userId,
            name,
            email,
            phone,
            list_id: listId || null,
            tenant: req.tenant, // Contact schema might vary, let's assume it should support tenant if added to model, otherwise ignored
            created_at: new Date(),
            updated_at: new Date()
        });

        await newContact.save();

        res.json({ success: true, contact: newContact });
    } catch (error) {
        console.error('Error creating contact:', error);
        res.status(500).json({ success: false, message: 'Failed to create contact' });
    }
});

/**
 * Update a contact
 * PUT /api/v1/contacts/:id
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        let query = Contact.findOne({ _id: id });
        applyTenantFilterFromRequest(req, query);
        const contact = await query;

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        // Allowed updates
        if (updates.name !== undefined) contact.name = updates.name;
        if (updates.email !== undefined) contact.email = updates.email;
        if (updates.phone !== undefined) contact.phone = updates.phone;
        if (updates.listId !== undefined) contact.list_id = updates.listId;

        contact.updated_at = new Date();
        await contact.save();

        res.json({ success: true, contact });
    } catch (error) {
        console.error('Error updating contact:', error);
        res.status(500).json({ success: false, message: 'Failed to update contact' });
    }
});

/**
 * Delete a contact
 * DELETE /api/v1/contacts/:id
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;

        let query = Contact.findOne({ _id: id });
        applyTenantFilterFromRequest(req, query);
        const contact = await query;

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        await Contact.deleteOne({ _id: id });

        res.json({ success: true, message: 'Contact deleted successfully' });
    } catch (error) {
        console.error('Error deleting contact:', error);
        res.status(500).json({ success: false, message: 'Failed to delete contact' });
    }
});

export default router;
