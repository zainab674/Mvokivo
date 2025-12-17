// server/campaign-management.js
import express from 'express';
import { Campaign, CampaignCall, CallQueue } from './models/index.js';
import { campaignEngine } from './campaign-execution-engine.js';
import { createLiveKitRoomTwiml } from './utils/livekit-room-helper.js';
import { applyTenantFilterFromRequest } from './utils/applyTenantFilterToQuery.js';

import { authenticateToken } from './utils/auth.js';

export const campaignManagementRouter = express.Router();

// Apply auth middleware to all routes
campaignManagementRouter.use(authenticateToken);

// Store campaign metadata temporarily for webhook access
const campaignMetadataStore = new Map();

/**
 * List campaigns for the current user
 * GET /api/v1/campaigns
 */
campaignManagementRouter.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Base query: campaigns belonging to the user
    let query = Campaign.find({ user_id: userId })
      .populate('assistant', 'name') // Populate assistant name
      .populate('contact_list', 'name') // Populate contact list name
      .populate('csv_file', 'name') // Populate csv file name
      .sort({ created_at: -1 });

    // Apply tenant filter
    applyTenantFilterFromRequest(req, query);

    const campaigns = await query;
    const total = await Campaign.countDocuments(query.getFilter());

    res.json({
      success: true,
      campaigns: campaigns || [],
      total: total || 0
    });
  } catch (error) {
    console.error('Error fetching campaigns:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaigns',
      error: error.message
    });
  }
});

/**
 * Create a new campaign
 * POST /api/v1/campaigns
 */
campaignManagementRouter.post('/', async (req, res) => {
  try {
    const userId = req.user.id;
    const data = req.body;

    // Ensure the user owns the assistant? (Ideally yes, but skipped for brevity/trust)

    const newCampaign = new Campaign({
      name: data.name,
      user_id: userId, // Enforce user_id from token
      assistant_id: data.assistantId,
      contact_list_id: data.contactListId || null,
      csv_file_id: data.csvFileId || null,
      contact_source: data.contactSource,
      daily_cap: data.dailyCap,
      calling_days: data.callingDays,
      start_hour: data.startHour,
      end_hour: data.endHour,
      campaign_prompt: data.campaignPrompt,
      status: 'draft',
      execution_status: 'idle',
      tenant: req.tenant // Enforce tenant from middleware
    });

    await newCampaign.save();

    res.json({
      success: true,
      campaignId: newCampaign._id,
      message: 'Campaign created successfully'
    });
  } catch (error) {
    console.error('Error creating campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create campaign',
      error: error.message
    });
  }
});

/**
 * Export campaign calls
 * GET /api/v1/campaigns/:id/export/calls
 */
campaignManagementRouter.get('/:id/export/calls', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign to verify access/tenant
    const campaignQuery = Campaign.findOne({ _id: id });
    applyTenantFilterFromRequest(req, campaignQuery);
    const campaign = await campaignQuery;

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    const calls = await CampaignCall.find({ campaign_id: id })
      .populate('campaign_id', 'name') // Assuming 'campaigns' ref in Mongoose is 'Campaign', check model definition
      .sort({ created_at: -1 });

    const exportData = calls.map(call => ({
      id: call.id,
      campaign_name: campaign.name,
      contact_name: call.contact_name || 'Unknown',
      phone_number: call.phone_number,
      status: call.status,
      outcome: call.outcome,
      call_duration: call.call_duration || 0,
      recording_url: call.recording_url,
      transcription: call.transcription,
      summary: call.summary,
      notes: call.notes,
      retry_count: call.retry_count || 0,
      scheduled_at: call.scheduled_at,
      started_at: call.started_at,
      completed_at: call.completed_at,
      created_at: call.created_at
    }));

    res.json({ success: true, calls: exportData });
  } catch (error) {
    console.error('Error exporting campaign calls:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Export campaign stats
 * GET /api/v1/campaigns/:id/export/stats
 */
campaignManagementRouter.get('/:id/export/stats', async (req, res) => {
  try {
    const { id } = req.params;

    const campaignQuery = Campaign.findOne({ _id: id });
    applyTenantFilterFromRequest(req, campaignQuery);
    const campaign = await campaignQuery;

    if (!campaign) {
      return res.status(404).json({ success: false, message: 'Campaign not found' });
    }

    // Get outcome stats
    const callStats = await CampaignCall.find({ campaign_id: id }).select('outcome');

    const outcomeCounts = {
      interested: 0,
      not_interested: 0,
      callback: 0,
      do_not_call: 0,
      voicemail: 0,
      wrong_number: 0
    };

    callStats.forEach(call => {
      if (call.outcome && outcomeCounts.hasOwnProperty(call.outcome)) {
        outcomeCounts[call.outcome]++;
      }
    });

    const answerRate = campaign.total_calls_made > 0
      ? (campaign.total_calls_answered / campaign.total_calls_made) * 100
      : 0;

    const successRate = campaign.total_calls_made > 0
      ? ((outcomeCounts.interested + outcomeCounts.callback) / campaign.total_calls_made) * 100
      : 0;

    const interestRate = campaign.total_calls_answered > 0
      ? (outcomeCounts.interested / campaign.total_calls_answered) * 100
      : 0;

    const statsData = [{
      campaign_name: campaign.name,
      execution_status: campaign.execution_status,
      daily_cap: campaign.daily_cap,
      current_daily_calls: campaign.current_daily_calls,
      total_calls_made: campaign.total_calls_made,
      total_calls_answered: campaign.total_calls_answered,
      answer_rate: answerRate,
      interested_count: outcomeCounts.interested,
      not_interested_count: outcomeCounts.not_interested,
      callback_count: outcomeCounts.callback,
      do_not_call_count: outcomeCounts.do_not_call,
      voicemail_count: outcomeCounts.voicemail,
      wrong_number_count: outcomeCounts.wrong_number,
      success_rate: successRate,
      interest_rate: interestRate,
      created_at: campaign.created_at,
      last_execution_at: campaign.last_execution_at,
      next_call_at: campaign.next_call_at
    }];

    res.json({ success: true, stats: statsData });
  } catch (error) {
    console.error('Error exporting campaign stats:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Export ALL campaigns data
 * GET /api/v1/campaigns/export/all
 */
campaignManagementRouter.get('/export/all', async (req, res) => {
  try {
    const userId = req.user.id;

    // Get all campaigns
    let campaignQuery = Campaign.find({ user_id: userId }).sort({ created_at: -1 });
    applyTenantFilterFromRequest(req, campaignQuery);
    const campaigns = await campaignQuery;

    if (!campaigns || campaigns.length === 0) {
      return res.json({ success: true, calls: [], stats: [] });
    }

    const campaignIds = campaigns.map(c => c._id);

    // Get calls
    const calls = await CampaignCall.find({ campaign_id: { $in: campaignIds } })
      // We need campaign name map, as populate might be slow or complex if referencing same collection? 
      // CampaignCall has campaign_id.
      .sort({ created_at: -1 });

    const campaignMap = new Map(campaigns.map(c => [c._id.toString(), c]));

    const callsExport = calls.map(call => ({
      id: call.id,
      campaign_name: campaignMap.get(call.campaign_id.toString())?.name || 'Unknown',
      contact_name: call.contact_name || 'Unknown',
      phone_number: call.phone_number,
      status: call.status,
      outcome: call.outcome,
      call_duration: call.call_duration || 0,
      recording_url: call.recording_url,
      transcription: call.transcription,
      summary: call.summary,
      notes: call.notes,
      retry_count: call.retry_count || 0,
      scheduled_at: call.scheduled_at,
      started_at: call.started_at,
      completed_at: call.completed_at,
      created_at: call.created_at
    }));

    // Stats export
    const statsExport = await Promise.all(campaigns.map(async (c) => {
      const outcomeCounts = {
        interested: 0,
        not_interested: 0,
        callback: 0,
        do_not_call: 0,
        voicemail: 0,
        wrong_number: 0
      };

      // We could batch fetch counts but loop is easier given we have calls loaded??
      // Actually we have all calls in `calls`. Filter in memory to save DB hits.
      const callsForCampaign = calls.filter(call => call.campaign_id.toString() === c._id.toString());

      callsForCampaign.forEach(call => {
        if (call.outcome && outcomeCounts.hasOwnProperty(call.outcome)) {
          outcomeCounts[call.outcome]++;
        }
      });

      const answerRate = c.total_calls_made > 0
        ? (c.total_calls_answered / c.total_calls_made) * 100
        : 0;

      const successRate = c.total_calls_made > 0
        ? ((outcomeCounts.interested + outcomeCounts.callback) / c.total_calls_made) * 100
        : 0;

      const interestRate = c.total_calls_answered > 0
        ? (outcomeCounts.interested / c.total_calls_answered) * 100
        : 0;

      return {
        campaign_name: c.name,
        execution_status: c.execution_status,
        daily_cap: c.daily_cap,
        current_daily_calls: c.current_daily_calls,
        total_calls_made: c.total_calls_made,
        total_calls_answered: c.total_calls_answered,
        answer_rate: answerRate,
        interested_count: outcomeCounts.interested,
        not_interested_count: outcomeCounts.not_interested,
        callback_count: outcomeCounts.callback,
        do_not_call_count: outcomeCounts.do_not_call,
        voicemail_count: outcomeCounts.voicemail,
        wrong_number_count: outcomeCounts.wrong_number,
        success_rate: successRate,
        interest_rate: interestRate,
        created_at: c.created_at,
        last_execution_at: c.last_execution_at,
        next_call_at: c.next_call_at
      };
    }));

    res.json({ success: true, calls: callsExport, stats: statsExport });

  } catch (error) {
    console.error('Error exporting all campaigns:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


/**
 * Start a campaign
 * POST /api/v1/campaigns/:id/start
 */
campaignManagementRouter.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign details
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign is already running
    if (campaign.execution_status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is already running'
      });
    }

    // Check if campaign can be started
    if (campaign.execution_status === 'completed') {
      return res.status(400).json({
        success: false,
        message: 'Cannot start a completed campaign'
      });
    }

    // Start the campaign
    await campaignEngine.startCampaign(id);

    res.json({
      success: true,
      message: 'Campaign started successfully'
    });

  } catch (error) {
    console.error('Error starting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to start campaign',
      error: error.message
    });
  }
});

/**
 * Pause a campaign
 * POST /api/v1/campaigns/:id/pause
 */
campaignManagementRouter.post('/:id/pause', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign details first with tenant filter
    let query = Campaign.findOne({ _id: id });
    applyTenantFilterFromRequest(req, query);
    const campaign = await query;

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign can be paused
    if (campaign.execution_status !== 'running') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not currently running'
      });
    }

    // Update campaign status
    campaign.execution_status = 'paused';
    campaign.status = 'paused';
    campaign.updated_at = new Date();
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign paused successfully'
    });

  } catch (error) {
    console.error('Error pausing campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to pause campaign'
    });
  }
});

/**
 * Resume a campaign
 * POST /api/v1/campaigns/:id/resume
 */
campaignManagementRouter.post('/:id/resume', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign details first with tenant filter
    let query = Campaign.findOne({ _id: id });
    applyTenantFilterFromRequest(req, query);
    const campaign = await query;

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign can be resumed
    if (campaign.execution_status !== 'paused') {
      return res.status(400).json({
        success: false,
        message: 'Campaign is not currently paused'
      });
    }

    // Update campaign status
    campaign.execution_status = 'running';
    campaign.status = 'active';
    campaign.next_call_at = new Date();
    campaign.updated_at = new Date();
    await campaign.save();

    res.json({
      success: true,
      message: 'Campaign resumed successfully'
    });

  } catch (error) {
    console.error('Error resuming campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resume campaign'
    });
  }
});

/**
 * Stop a campaign
 * POST /api/v1/campaigns/:id/stop
 */
campaignManagementRouter.post('/:id/stop', async (req, res) => {
  try {
    const { id } = req.params;

    // Update campaign status (both fields for consistency)
    await Campaign.updateOne(
      { _id: id },
      {
        execution_status: 'completed',
        status: 'completed',
        updated_at: new Date()
      }
    );

    // Cancel pending calls in queue with tenant filter
    // Mongoose updateMany with tenant filter
    let queueQuery = CallQueue.find({ campaign_id: id, status: 'queued' });
    applyTenantFilterFromRequest(req, queueQuery);

    // We first find the IDs to update or update directly using the query criteria
    // Since applyTenantFilter modifies the query object, we can extract the filter
    const filter = queueQuery.getFilter();

    await CallQueue.updateMany(filter, {
      status: 'cancelled',
      updated_at: new Date()
    });

    res.json({
      success: true,
      message: 'Campaign stopped successfully'
    });

  } catch (error) {
    console.error('Error stopping campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to stop campaign'
    });
  }
});

/**
 * Get campaign status and metrics
 * GET /api/v1/campaigns/:id/status
 */
campaignManagementRouter.get('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign details
    const campaign = await Campaign.findById(id);

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Efficiently aggregate call stats
    // We want counts by status and outcome
    // Since we need to apply tenant filter, let's verify if Aggregation handles it easily
    // We can just add match stage.
    // However, applyTenantFilter helper works on Query, not Aggregate.
    // But we can construct the match object manually or instantiate a dummy query to get filter.
    // Simpler: just match on campaign_id and assume user has access to campaign implies access to calls
    // (since we fetched campaign above). Or better, enforce tenant if needed.
    // Assuming for now campaign ownership is sufficient or tenant is same as campaign.

    const callStatsAggregation = await CampaignCall.aggregate([
      { $match: { campaign_id: id } },
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          pending: { $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] } },
          calling: { $sum: { $cond: [{ $eq: ["$status", "calling"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          answered: { $sum: { $cond: [{ $eq: ["$status", "answered"] }, 1, 0] } },
          // Outcomes
          noAnswer: { $sum: { $cond: [{ $eq: ["$outcome", "no_answer"] }, 1, 0] } },
          busy: { $sum: { $cond: [{ $eq: ["$outcome", "busy"] }, 1, 0] } },
          interested: { $sum: { $cond: [{ $eq: ["$outcome", "interested"] }, 1, 0] } },
          notInterested: { $sum: { $cond: [{ $eq: ["$outcome", "not_interested"] }, 1, 0] } },
          callback: { $sum: { $cond: [{ $eq: ["$outcome", "callback"] }, 1, 0] } },
          doNotCall: { $sum: { $cond: [{ $eq: ["$outcome", "do_not_call"] }, 1, 0] } }
        }
      }
    ]);

    const stats = callStatsAggregation[0] || {
      total: 0, pending: 0, calling: 0, completed: 0, failed: 0, answered: 0,
      noAnswer: 0, busy: 0, interested: 0, notInterested: 0, callback: 0, doNotCall: 0
    };

    // Get queue status
    const queueStatsAggregation = await CallQueue.aggregate([
      { $match: { campaign_id: id } },
      {
        $group: {
          _id: null,
          queued: { $sum: { $cond: [{ $eq: ["$status", "queued"] }, 1, 0] } },
          processing: { $sum: { $cond: [{ $eq: ["$status", "processing"] }, 1, 0] } },
          completed: { $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] } },
          failed: { $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] } },
          cancelled: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 1, 0] } }
        }
      }
    ]);

    const queueStats = queueStatsAggregation[0] || {
      queued: 0, processing: 0, completed: 0, failed: 0, cancelled: 0
    };

    res.json({
      success: true,
      campaign: {
        campaign: {
          id: campaign._id,
          name: campaign.name,
          execution_status: campaign.execution_status,
          daily_cap: campaign.daily_cap,
          current_daily_calls: campaign.current_daily_calls,
          total_calls_made: campaign.total_calls_made,
          total_calls_answered: campaign.total_calls_answered,
          last_execution_at: campaign.last_execution_at,
          next_call_at: campaign.next_call_at,
          calling_days: campaign.calling_days,
          start_hour: campaign.start_hour,
          end_hour: campaign.end_hour,
          campaign_prompt: campaign.campaign_prompt
        },
        stats: {
          total: stats.total,
          pending: stats.pending,
          calling: stats.calling,
          completed: stats.completed,
          failed: stats.failed,
          answered: stats.answered,
          // Outcomes
          noAnswer: stats.noAnswer,
          busy: stats.busy,
          interested: stats.interested,
          notInterested: stats.notInterested,
          callback: stats.callback,
          doNotCall: stats.doNotCall
        },
        queueStatus: {
          queued: queueStats.queued,
          processing: queueStats.processing,
          completed: queueStats.completed,
          failed: queueStats.failed,
          cancelled: queueStats.cancelled
        }
      }
    });

  } catch (error) {
    console.error('Error fetching campaign status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign status'
    });
  }
});

/**
 * Get campaign calls with pagination
 * GET /api/v1/campaigns/:id/calls
 */
campaignManagementRouter.get('/:id/calls', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      status,
      outcome,
      limit = 50,
      offset = 0,
      sortBy = 'created_at',
      sortOrder = 'desc'
    } = req.query;

    let query = CampaignCall.find({ campaign_id: id });

    // Add tenant filter
    applyTenantFilterFromRequest(req, query);

    if (status) query.where('status', status);
    if (outcome) query.where('outcome', outcome);

    const sortObject = {};
    sortObject[sortBy] = sortOrder === 'asc' ? 1 : -1;

    // Get data
    const calls = await CampaignCall.find(query.getFilter()) // create new query from filter to allow counting on base query? No, just run simple.
      .sort(sortObject)
      .skip(parseInt(offset))
      .limit(parseInt(limit));

    // Get total count
    const count = await CampaignCall.countDocuments(query.getFilter());

    res.json({
      success: true,
      calls: calls || [],
      total: count || 0,
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

  } catch (error) {
    console.error('Error fetching campaign calls:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch campaign calls'
    });
  }
});

/**
 * Reset campaign daily counters
 * POST /api/v1/campaigns/:id/reset-daily
 */
campaignManagementRouter.post('/:id/reset-daily', async (req, res) => {
  try {
    const { id } = req.params;

    // Reset daily counters with tenant filter
    let query = Campaign.findOneAndUpdate(
      { _id: id },
      {
        $set: {
          current_daily_calls: 0,
          updated_at: new Date()
        }
      }
    );
    applyTenantFilterFromRequest(req, query);

    // We need to execute the query
    await query;

    res.json({
      success: true,
      message: 'Daily counters reset successfully'
    });

  } catch (error) {
    console.error('Error resetting daily counters:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset daily counters'
    });
  }
});

/**
 * Delete a campaign
 * DELETE /api/v1/campaigns/:id
 */
campaignManagementRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get campaign details first
    let query = Campaign.findOne({ _id: id });
    applyTenantFilterFromRequest(req, query);
    const campaign = await query;

    if (!campaign) {
      return res.status(404).json({
        success: false,
        message: 'Campaign not found'
      });
    }

    // Check if campaign is currently running
    if (campaign.execution_status === 'running') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a running campaign. Please stop the campaign first.'
      });
    }

    // Manual Cascade Delete
    await CampaignCall.deleteMany({ campaign_id: id });
    await CallQueue.deleteMany({ campaign_id: id });

    // Delete the campaign
    await Campaign.deleteOne({ _id: id });

    res.json({
      success: true,
      message: 'Campaign deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting campaign:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete campaign',
      error: error.message
    });
  }
});

/**
 * Get campaign execution engine status
 * GET /api/v1/campaigns/engine/status
 */
campaignManagementRouter.get('/engine/status', async (req, res) => {
  try {
    res.json({
      success: true,
      engine: {
        isRunning: campaignEngine.isRunning,
        checkInterval: campaignEngine.checkInterval
      }
    });
  } catch (error) {
    console.error('Error fetching engine status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engine status'
    });
  }
});

/**
 * Store campaign metadata for webhook access
 * POST /api/v1/campaigns/metadata/:roomName
 */
campaignManagementRouter.post('/metadata/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;
    const metadata = req.body;

    // Store metadata temporarily (expires after 1 hour)
    campaignMetadataStore.set(roomName, {
      ...metadata,
      timestamp: Date.now()
    });

    // Clean up old entries (older than 1 hour)
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    for (const [key, value] of campaignMetadataStore.entries()) {
      if (value.timestamp < oneHourAgo) {
        campaignMetadataStore.delete(key);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error storing campaign metadata:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to store campaign metadata'
    });
  }
});

/**
 * Webhook endpoint for Twilio to create LiveKit room with campaign metadata
 * POST /api/v1/campaigns/webhook/:roomName
 */
campaignManagementRouter.post('/webhook/:roomName', async (req, res) => {
  try {
    const { roomName } = req.params;

    // Get stored metadata
    const metadata = campaignMetadataStore.get(roomName);
    if (!metadata) {
      console.error('No metadata found for room:', roomName);
      return res.status(404).json({
        success: false,
        message: 'Campaign metadata not found'
      });
    }

    // Clean up metadata
    campaignMetadataStore.delete(roomName);

    // Create LiveKit room directly without HTTP request
    try {
      const twiml = await createLiveKitRoomTwiml({
        roomName,
        assistantId: metadata.assistantId,
        phoneNumber: metadata.contactInfo.phone,
        campaignId: metadata.campaignId,
        campaignPrompt: metadata.campaignPrompt,
        contactInfo: metadata.contactInfo
      });

      res.set('Content-Type', 'text/xml');
      res.send(twiml);
    } catch (error) {
      console.error('Error creating LiveKit room:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to create LiveKit room',
        error: error.message
      });
    }

  } catch (error) {
    console.error('Error in campaign webhook:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create LiveKit room'
    });
  }
});
