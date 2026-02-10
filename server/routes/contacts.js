import express from 'express';
import mongoose from 'mongoose';
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

        // Fetch counts for each list
        const listsWithCounts = await Promise.all(lists.map(async (list) => {
            const count = await Contact.countDocuments({ list_id: list._id });
            return {
                ...list.toObject(),
                id: list._id,
                count
            };
        }));

        res.json({ success: true, lists: listsWithCounts });
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
                { first_name: { $regex: search, $options: 'i' } },
                { last_name: { $regex: search, $options: 'i' } },
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
        const contacts = await query
            .sort({ created_at: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate('list_id');

        // Map contacts to include list_name for UI
        const transformedContacts = contacts.map(c => {
            const obj = c.toObject();
            return {
                ...obj,
                id: obj._id,
                list_name: obj.list_id && obj.list_id.name ? obj.list_id.name : (obj.list_id ? 'Unknown List' : 'No List'),
                list_id: obj.list_id && obj.list_id._id ? obj.list_id._id : (obj.list_id || null),
                first_name: obj.first_name || (obj.name ? obj.name.split(' ')[0] : ''),
                last_name: obj.last_name || (obj.name ? obj.name.split(' ').slice(1).join(' ') : '')
            };
        });

        res.json({
            success: true,
            contacts: transformedContacts,
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
            name: req.body.name || (req.body.first_name + (req.body.last_name ? ` ${req.body.last_name}` : '')),
            first_name: req.body.first_name || (req.body.name ? req.body.name.split(' ')[0] : ''),
            last_name: req.body.last_name || (req.body.name ? req.body.name.split(' ').slice(1).join(' ') : ''),
            email,
            phone,
            list_id: listId && listId !== 'all' ? listId : null,
            status: req.body.status || 'active',
            do_not_call: req.body.do_not_call || false,
            tenant: req.tenant,
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
 * Bulk create contacts
 * POST /api/v1/contacts/bulk
 */
router.post('/bulk', async (req, res) => {
    try {
        const userId = req.user.id;
        const { contacts, listId } = req.body;

        if (!contacts || !Array.isArray(contacts)) {
            return res.status(400).json({ success: false, message: 'Contacts array is required' });
        }

        const contactsToInsert = contacts.map(c => {
            const firstName = c.first_name || (c.name ? c.name.split(' ')[0] : '');
            const lastName = c.last_name || (c.name ? c.name.split(' ').slice(1).join(' ') : '');
            const name = c.name || (firstName + (lastName ? ` ${lastName}` : ''));

            return {
                user_id: userId,
                name: name,
                first_name: firstName,
                last_name: lastName,
                email: c.email,
                phone: c.phone || c.phone_number,
                list_id: listId || c.listId || c.list_id || null,
                status: c.status || 'active',
                do_not_call: c.do_not_call || false,
                tenant: req.tenant,
                created_at: new Date(),
                updated_at: new Date()
            };
        });

        const result = await Contact.insertMany(contactsToInsert);

        res.json({
            success: true,
            message: `Successfully imported ${result.length} contacts`,
            count: result.length
        });
    } catch (error) {
        console.error('Error bulk creating contacts:', error);
        res.status(500).json({ success: false, message: 'Failed to bulk create contacts' });
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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid contact ID format' });
        }

        let query = Contact.findOne({ _id: id });
        applyTenantFilterFromRequest(req, query);
        const contact = await query;

        if (!contact) {
            return res.status(404).json({ success: false, message: 'Contact not found' });
        }

        // Allowed updates
        if (updates.name !== undefined) contact.name = updates.name;
        if (updates.first_name !== undefined) contact.first_name = updates.first_name;
        if (updates.last_name !== undefined) contact.last_name = updates.last_name;
        if (updates.email !== undefined) contact.email = updates.email;
        if (updates.phone !== undefined) contact.phone = updates.phone;
        if (updates.listId !== undefined) contact.list_id = (updates.listId === 'all' || !updates.listId) ? null : updates.listId;
        if (updates.status !== undefined) contact.status = updates.status;
        if (updates.do_not_call !== undefined) contact.do_not_call = updates.do_not_call;
        if (updates.doNotCall !== undefined) contact.do_not_call = updates.doNotCall;

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

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({ success: false, message: 'Invalid contact ID format' });
        }

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
