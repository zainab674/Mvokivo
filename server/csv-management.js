// server/csv-management.js
import express from 'express';
import { CsvFile, CsvContact, Campaign } from './models/index.js';
import { authenticateToken } from './utils/auth.js';
import { applyTenantFilterFromRequest } from './utils/applyTenantFilterToQuery.js';

export const csvManagementRouter = express.Router();

// Apply auth middleware
csvManagementRouter.use(authenticateToken);

/**
 * List CSV files
 * GET /api/v1/csv
 */
csvManagementRouter.get('/', async (req, res) => {
  try {
    const userId = req.user.id;
    let query = CsvFile.find({ user_id: userId }).sort({ created_at: -1 });
    applyTenantFilterFromRequest(req, query);

    const files = await query;
    res.json({ success: true, csvFiles: files });
  } catch (error) {
    console.error('Error fetching CSV files:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch CSV files' });
  }
});

/**
 * Create CSV file metadata
 * POST /api/v1/csv
 */
csvManagementRouter.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, rowCount, fileSize } = req.body;

    // Note: The actual file upload handling (if any) would go here or separate endpoint.
    // For now, mirroring existing behavior where client parses and sends metadata.

    const newFile = new CsvFile({
      user_id: userId,
      filename: name, // map name to filename
      original_filename: name,
      row_count: rowCount,
      file_size: fileSize, // Note: schema says file_size is missing in snippet but maybe exists? 
      // Checking snippet again:
      // headers: [String], file_path: String, row_count, status.
      // Schema doesn't have file_size explicitly but Mongoose Mixed or flexible? 
      // Actually schema snippet had: 350: filename, 351: original_filename.
      // Let's stick to schema fields.
      status: 'pending',
      tenant: req.tenant,
      created_at: new Date()
    });

    await newFile.save();

    res.json({
      success: true,
      csvFile: {
        id: newFile._id, // Frontend expects `csvFileId` or `id`? Check saveCsvFile.ts: returns csvFileId: csvFile.id
        ...newFile.toObject()
      }
    });
  } catch (error) {
    console.error('Error creating CSV file:', error);
    res.status(500).json({ success: false, message: 'Failed to create CSV file' });
  }
});

/**
 * Batch add contacts to CSV
 * POST /api/v1/csv/:id/contacts
 */
csvManagementRouter.post('/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    const { contacts } = req.body; // Array of contact objects

    if (!contacts || !Array.isArray(contacts)) {
      return res.status(400).json({ success: false, message: 'Contacts array is required' });
    }

    // Verify CSV file ownership/tenant
    let fileQuery = CsvFile.findOne({ _id: id }); // Assumes id passed is _id
    // The frontend refactor will need to handle ID mapping if migrating data.
    // But for NEW data, it will be Mongo _id.
    // However, existing IDs in frontend might be UUIDs. MongoDB _id is usually 24 chars.
    // server/models/index.js schema: 
    // CsvFile schema doesn't define _id explicitly so it's ObjectId.
    // BUT lines 444: PaymentMethod id: { type: String, required: true }.
    // CsvFile lines 348-358: NO custom id. So it is ObjectId.
    // Frontend likely expects string.

    applyTenantFilterFromRequest(req, fileQuery);
    const csvFile = await fileQuery;

    if (!csvFile) {
      return res.status(404).json({ success: false, message: 'CSV file not found' });
    }

    // Insert contacts
    const contactsToInsert = contacts.map(c => ({
      csv_file_id: id,
      user_id: req.user.id,
      first_name: c.first_name,
      last_name: c.last_name,
      phone_number: c.phone || c.phone_number,
      email: c.email,
      status: c.status || 'active',
      do_not_call: c.do_not_call || false,
      tenant: req.tenant,
      created_at: new Date()
    }));

    // Batch insert
    const result = await CsvContact.insertMany(contactsToInsert);

    // Update file status
    csvFile.status = 'ready'; // or 'completed'
    csvFile.row_count = (csvFile.row_count || 0) + result.length;
    await csvFile.save();

    res.json({
      success: true,
      savedCount: result.length
    });
  } catch (error) {
    console.error('Error saving CSV contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to save CSV contacts' });
  }
});

/**
 * Get contacts for a CSV file
 * GET /api/v1/csv/:id/contacts
 */
csvManagementRouter.get('/:id/contacts', async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 50 } = req.query;

    // Verify file access
    let fileQuery = CsvFile.findOne({ _id: id }); // Using _id as ID
    // If id is not ObjectId this might fail cast. 
    // Mongoose usually handles cast error.

    // If frontend sendsis query will fail (autocast to ObjectId fails).
    // We update frontend to expect ObjectId or handle 404.

    applyTenantFilterFromRequest(req, fileQuery);
    // Find file first to ensure access
    let csvFile;
    try {
      csvFile = await fileQuery;
    } catch (e) {
      // CastError for UUID
      if (e.name === 'CastError') return res.status(404).json({ success: false, message: 'CSV file not found' });
      throw e;
    }

    if (!csvFile) {
      return res.status(404).json({ success: false, message: 'CSV file not found' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const contacts = await CsvContact.find({ csv_file_id: id })
      .sort({ created_at: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await CsvContact.countDocuments({ csv_file_id: id });

    res.json({
      success: true,
      contacts: contacts.map(c => ({
        ...c.toObject(),
        id: c._id // Map _id to id for frontend compatibility
      })),
      total,
      page: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    console.error('Error fetching CSV contacts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch CSV contacts' });
  }
});

/**
 * Delete a CSV file
 * DELETE /api/v1/csv/:id
 */
csvManagementRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get CSV file details first to check if it exists
    let query = CsvFile.findOne({ _id: id });
    applyTenantFilterFromRequest(req, query);
    const csvFile = await query;

    if (!csvFile) {
      return res.status(404).json({
        success: false,
        message: 'CSV file not found'
      });
    }

    // Check if any campaigns are using this CSV file
    const campaigns = await Campaign.find({ csv_file_id: id }).select('id name execution_status');

    if (campaigns && campaigns.length > 0) {
      const activeCampaigns = campaigns.filter(c => c.execution_status === 'running');
      if (activeCampaigns.length > 0) {
        return res.status(400).json({
          success: false,
          message: `Cannot delete CSV file. It is being used by ${activeCampaigns.length} running campaign(s). Please stop the campaigns first.`,
          campaigns: activeCampaigns.map(c => ({ id: c.id, name: c.name }))
        });
      }

      return res.status(400).json({
        success: false,
        message: `Cannot delete CSV file. It is being used by ${campaigns.length} campaign(s). Please delete or change the campaigns first.`,
        campaigns: campaigns.map(c => ({ id: c.id, name: c.name }))
      });
    }

    // Delete related csv_contacts manually (replace cascade delete)
    await CsvContact.deleteMany({ csv_file_id: id });

    // Delete the CSV file
    await CsvFile.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'CSV file deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting CSV file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete CSV file',
      error: error.message
    });
  }
});

/**
 * Get CSV file details
 * GET /api/v1/csv/:id
 */
csvManagementRouter.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    let query = CsvFile.findOne({ _id: id });
    applyTenantFilterFromRequest(req, query);
    const csvFile = await query;

    if (!csvFile) {
      return res.status(404).json({
        success: false,
        message: 'CSV file not found'
      });
    }

    // Count contacts efficiently
    const contactCount = await CsvContact.countDocuments({ csv_file_id: id });

    res.json({
      success: true,
      csvFile: {
        ...csvFile.toObject(),
        contact_count: contactCount,
        id: csvFile._id
      }
    });

  } catch (error) {
    console.error('Error fetching CSV file:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch CSV file'
    });
  }
});
