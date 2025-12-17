// server/campaign-execution-engine.js
import { Campaign, CampaignCall, CallQueue, PhoneNumber, Contact, CsvContact, ContactList } from './models/index.js';

class CampaignExecutionEngine {
  constructor() {
    this.isRunning = false;
    this.executionInterval = null;
    this.checkInterval = 30000; // Check every 30 seconds
  }

  /**
   * Start the campaign execution engine
   */
  start() {
    if (this.isRunning) {
      console.log('Campaign execution engine is already running');
      return;
    }

    this.isRunning = true;
    console.log('Starting campaign execution engine...');

    // Check for campaigns to execute immediately
    this.executeCampaigns();

    // Set up interval for regular checks
    this.executionInterval = setInterval(() => {
      this.executeCampaigns();
    }, this.checkInterval);
  }

  /**
   * Stop the campaign execution engine
   */
  stop() {
    if (this.executionInterval) {
      clearInterval(this.executionInterval);
      this.executionInterval = null;
    }
    this.isRunning = false;
    console.log('Campaign execution engine stopped');
  }

  /**
   * Execute campaigns that are ready to run
   */
  async executeCampaigns() {
    try {
      // Get active campaigns that are ready to execute
      const campaigns = await Campaign.find({
        execution_status: 'running',
        next_call_at: { $lte: new Date() }
      }).sort({ next_call_at: 1 });

      if (!campaigns || campaigns.length === 0) {
        // console.log('No campaigns ready to execute');
        return;
      }

      console.log(`Found ${campaigns.length} campaigns ready to execute`);

      for (const campaign of campaigns) {
        try {
          await this.executeCampaign(campaign);
        } catch (campaignError) {
          console.error(`Error executing campaign ${campaign._id}:`, campaignError);
          // Mark campaign as error status
          campaign.execution_status = 'error';
          campaign.updated_at = new Date();
          await campaign.save();
        }
      }

    } catch (error) {
      console.error('Error in executeCampaigns:', error);
    }
  }

  /**
   * Execute a single campaign - processes all calls immediately and continuously
   */
  async executeCampaign(campaign) {
    try {
      console.log(`Executing campaign: ${campaign.name} (${campaign._id})`);

      // Check if campaign should be paused or stopped
      if (!this.shouldExecuteCampaign(campaign)) {
        await this.pauseCampaign(campaign._id, 'Daily cap reached or outside calling hours');
        return;
      }

      // Process all calls immediately and continuously (like urban-new system)
      await this.processAllCalls(campaign);

    } catch (error) {
      console.error(`Error executing campaign ${campaign._id}:`, error);
      await this.pauseCampaign(campaign._id, `Execution error: ${error.message}`);
    }
  }

  /**
   * Process all calls with proper queue management and rate limiting
   */
  async processAllCalls(campaign) {
    console.log(`🔄 Starting queue-based processing for campaign: ${campaign.name}`);

    // First, queue all contacts for this campaign
    await this.queueCampaignCalls(campaign);

    // Process calls from the queue with proper rate limiting
    await this.processCallQueue(campaign);
  }

  /**
   * Queue all contacts for a campaign
   */
  async queueCampaignCalls(campaign) {
    const contacts = await this.getCampaignContacts(campaign);
    if (!contacts || contacts.length === 0) {
      console.log(`No contacts found for campaign: ${campaign.name}`);
      await this.completeCampaign(campaign._id);
      return;
    }

    console.log(`📞 Queuing ${contacts.length} contacts for campaign: ${campaign.name}`);

    for (const contact of contacts) {
      try {
        // Check if campaign call already exists for this contact in this campaign
        let campaignCall = await CampaignCall.findOne({
          campaign_id: campaign._id,
          phone_number: contact.phone_number,
          contact_name: contact.name
        });

        if (campaignCall) {
          // Update existing call if it's not already completed
          if (campaignCall.status === 'completed' || campaignCall.status === 'failed') {
            console.log(`⏭️ Skipping contact ${contact.name} - already completed/failed`);
            continue;
          }

          // Update existing call to pending
          campaignCall.status = 'pending';
          campaignCall.scheduled_at = new Date();
          await campaignCall.save();

          console.log(`🔄 Updated existing call for ${contact.name}`);
        } else {
          // Create new campaign call record
          campaignCall = new CampaignCall({
            campaign_id: campaign._id,
            contact_id: campaign.contact_source === 'contact_list' ? contact.id : null,
            phone_number: contact.phone_number,
            contact_name: contact.name,
            email: contact.email,
            status: 'pending',
            tenant: campaign.tenant || 'main',
            scheduled_at: new Date()
          });
          await campaignCall.save();

          console.log(`➕ Created new call for ${contact.name}`);
        }

        // Check if queue item already exists
        let queueItem = await CallQueue.findOne({
          campaign_id: campaign._id,
          campaign_call_id: campaignCall._id.toString()
        });

        if (queueItem) {
          // Update existing queue item if it's not already completed
          if (queueItem.status === 'completed' || queueItem.status === 'failed') {
            console.log(`⏭️ Skipping queue item for ${contact.name} - already completed/failed`);
            continue;
          }

          queueItem.status = 'queued';
          queueItem.scheduled_for = new Date();
          queueItem.updated_at = new Date();
          await queueItem.save();

          console.log(`🔄 Updated existing queue item for ${contact.name}`);
        } else {
          // Add new item to call queue
          queueItem = new CallQueue({
            campaign_id: campaign._id,
            campaign_call_id: campaignCall._id.toString(),
            phone_number: contact.phone_number,
            scheduled_for: new Date(),
            status: 'queued',
            tenant: campaign.tenant || 'main',
            priority: 0
          });
          await queueItem.save();

          console.log(`➕ Added new queue item for ${contact.name}`);
        }
      } catch (error) {
        console.error(`Error queuing contact ${contact.name}:`, error);
      }
    }
  }

  /**
   * Process calls from the queue with proper rate limiting
   */
  async processCallQueue(campaign) {
    const batchSize = 5; // Process 5 calls at a time
    let processedCount = 0;
    const maxCallsPerExecution = campaign.daily_cap - campaign.current_daily_calls;

    console.log(`🔄 Processing call queue for campaign: ${campaign.name}, max calls: ${maxCallsPerExecution}`);

    while (processedCount < maxCallsPerExecution) {
      // Check if campaign should continue
      if (!this.shouldExecuteCampaign(campaign)) {
        console.log(`Campaign ${campaign.name} reached daily cap or outside calling hours, pausing`);
        await this.pauseCampaign(campaign._id, 'Daily cap reached or outside calling hours');
        return;
      }

      // Check if campaign is still running (fetch fresh)
      const currentCampaign = await Campaign.findById(campaign._id).select('execution_status');
      if (!currentCampaign || currentCampaign.execution_status !== 'running') {
        console.log(`Campaign ${campaign.name} is no longer running, stopping`);
        return;
      }

      // Get next batch of queued calls
      // Use campaign_id and string matching (since we stored ID as string in CallQueue)
      const queueItems = await CallQueue.find({
        campaign_id: campaign._id,
        status: 'queued'
      })
        .sort({ scheduled_for: 1 })
        .limit(batchSize);

      if (!queueItems || queueItems.length === 0) {
        console.log(`No more queued calls for campaign: ${campaign.name}`);
        await this.completeCampaign(campaign._id);
        return;
      }

      // Process batch
      for (const queueItem of queueItems) {
        try {
          console.log(`📞 Processing call ${processedCount + 1}/${maxCallsPerExecution}: ${queueItem.phone_number}`);

          // Need to fetch associated CampaignCall
          const campaignCall = await CampaignCall.findById(queueItem.campaign_call_id);
          if (!campaignCall) {
            console.error(`CampaignCall not found for queueItem ${queueItem._id}`);
            queueItem.status = 'failed';
            await queueItem.save();
            continue;
          }

          // Attach campaignCall to queueItem for downstream use
          queueItem.campaign_calls = campaignCall;

          await this.executeCall(campaign, queueItem);
          processedCount++;

          // Update campaign metrics
          await Campaign.updateOne(
            { _id: campaign._id },
            {
              $inc: { current_daily_calls: 1 },
              $set: { last_execution_at: new Date() }
            }
          );

          // Update campaign object for next iteration
          campaign.current_daily_calls = campaign.current_daily_calls + 1;

          console.log(`✅ Call ${processedCount} completed for campaign: ${campaign.name}`);

        } catch (callError) {
          console.error(`❌ Call failed for campaign ${campaign.name}:`, callError);

          // Mark call as failed
          await CampaignCall.updateOne(
            { _id: queueItem.campaign_call_id },
            {
              status: 'failed',
              completed_at: new Date(),
              notes: callError.message
            }
          );

          // Mark queue item as failed
          queueItem.status = 'failed';
          queueItem.updated_at = new Date();
          await queueItem.save();
        }

        // Add delay between calls
        await new Promise(resolve => setTimeout(resolve, 3000)); // 3 second delay
      }
    }

    console.log(`🎉 Completed processing ${processedCount} calls for campaign: ${campaign.name}`);
  }

  /**
   * Get all contacts for a campaign (like urban-new system)
   */
  async getCampaignContacts(campaign) {
    let contacts = [];

    // Get contacts based on campaign source
    if (campaign.contact_source === 'contact_list' && campaign.contact_list_id) {
      // Find contacts in the list
      // Assuming Contact model has list_id
      const listContacts = await Contact.find({ list_id: campaign.contact_list_id });
      if (listContacts) {
        contacts = listContacts;
      }
    } else if (campaign.contact_source === 'csv_file' && campaign.csv_file_id) {
      const csvContacts = await CsvContact.find({
        csv_file_id: campaign.csv_file_id,
        do_not_call: false
      });

      if (csvContacts) {
        contacts = csvContacts;
      }
    }

    // Format contacts consistently
    return contacts.map(contact => {
      let phoneNumber = contact.phone_number || contact.phone;
      // Handle name: contact.name or composite name
      const contactName = contact.name || contact.first_name || `${contact.first_name || ''} ${contact.last_name || ''}`.trim() || 'Unknown';

      // Fix phone number formatting
      if (phoneNumber && typeof phoneNumber === 'number') {
        phoneNumber = phoneNumber.toString();
      }

      // Ensure phone number has proper format
      if (phoneNumber && !phoneNumber.startsWith('+')) {
        if (phoneNumber.startsWith('44')) {
          phoneNumber = '+' + phoneNumber;
        } else if (phoneNumber.startsWith('0')) {
          phoneNumber = '+44' + phoneNumber.substring(1);
        } else if (phoneNumber.length === 10 && phoneNumber.startsWith('4')) {
          phoneNumber = '+44' + phoneNumber;
        }
      }

      return {
        id: contact._id || contact.id, // Mongoose ID
        name: contactName,
        phone_number: phoneNumber,
        email: contact.email || contact.email_address || ''
      };
    }).filter(contact => contact.phone_number && contact.phone_number.length >= 7);
  }

  /**
   * Create failed call record (helper if needed, but mostly handled in processLoop)
   */
  async createFailedCallRecord(campaign, contact, errorMessage) {
    const tenant = campaign.tenant || 'main';

    const campaignCall = new CampaignCall({
      campaign_id: campaign._id,
      contact_id: campaign.contact_source === 'contact_list' ? contact.id : null,
      phone_number: contact.phone_number,
      contact_name: contact.name,
      status: 'failed',
      started_at: new Date(),
      completed_at: new Date(),
      notes: errorMessage,
      tenant: tenant
    });
    await campaignCall.save();
  }

  /**
   * Check if campaign should continue executing
   */
  shouldExecuteCampaign(campaign) {
    const now = new Date();
    const currentHour = now.getHours();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase(); // 'monday', 'tuesday', etc.

    console.log(`🔍 Debugging campaign ${campaign.name}:`);
    console.log(`  Current time: ${now.toISOString()}`);
    console.log(`  Current hour: ${currentHour}`);
    console.log(`  Current day: ${currentDay}`);
    console.log(`  Campaign start hour: ${campaign.start_hour}`);
    console.log(`  Campaign end hour: ${campaign.end_hour}`);
    console.log(`  Campaign calling days: ${JSON.stringify(campaign.calling_days)}`);
    // Mongoose default ensures these are set, but let's be safe
    const dailyCap = campaign.daily_cap || 100;
    const currentDailyCalls = campaign.current_daily_calls || 0;

    console.log(`  Current daily calls: ${currentDailyCalls}`);
    console.log(`  Daily cap: ${dailyCap}`);

    // Check if we're within calling hours
    let withinHours = false;

    // Special case: if both start and end are 0, it means 24/7 (all day)
    if (campaign.start_hour === 0 && campaign.end_hour === 0) {
      withinHours = true;
      console.log(`  ✅ 24/7 calling hours enabled`);
    } else if (campaign.start_hour <= campaign.end_hour) {
      // Normal case: start and end on same day (e.g., 9 AM to 5 PM)
      withinHours = currentHour >= campaign.start_hour && currentHour < campaign.end_hour;
    } else {
      // Cross-midnight case: start before midnight, end after midnight (e.g., 10 PM to 2 AM)
      withinHours = currentHour >= campaign.start_hour || currentHour < campaign.end_hour;
    }

    if (!withinHours) {
      console.log(`  ❌ Outside calling hours: ${currentHour} not between ${campaign.start_hour}-${campaign.end_hour}`);
      return false;
    }

    // Check if today is a calling day
    if (!campaign.calling_days.includes(currentDay)) {
      console.log(`  ❌ Not a calling day: ${currentDay} not in ${JSON.stringify(campaign.calling_days)}`);
      return false;
    }

    // Check daily cap
    if (currentDailyCalls >= dailyCap) {
      console.log(`  ❌ Daily cap reached: ${currentDailyCalls}/${dailyCap}`);
      return false;
    }

    console.log(`  ✅ Campaign should execute!`);
    return true;
  }

  async executeCall(campaign, queueItem) {
    try {
      const campaignCall = queueItem.campaign_calls;

      // 1) mark processing
      queueItem.status = 'processing';
      await queueItem.save();

      campaignCall.status = 'calling';
      campaignCall.started_at = new Date();
      await campaignCall.save();

      // 2) resolve outbound trunk + caller id
      let outboundTrunkId = null, fromNumber = null;
      if (campaign.assistant_id) {
        // Mongoose query
        const assistantPhone = await PhoneNumber.findOne({
          inbound_assistant_id: campaign.assistant_id,
          status: 'active'
        });

        if (assistantPhone) {
          outboundTrunkId = assistantPhone.outbound_trunk_id;
          fromNumber = assistantPhone.number;
        }
      }

      if (!outboundTrunkId && fromNumber) {
        // Try to find trunk_sid from PhoneNumber if available
        const phoneObj = await PhoneNumber.findOne({ number: fromNumber });
        if (phoneObj && phoneObj.trunk_sid) outboundTrunkId = phoneObj.trunk_sid;
      }

      // Fallback for demo/testing if not found
      if (!outboundTrunkId) outboundTrunkId = 'default';

      // 3) build room & metadata
      const baseUrl = process.env.NGROK_URL || process.env.BACKEND_URL || 'http://localhost:8080';
      const callId = `campaign-${campaign._id}-${campaignCall._id}-${Date.now()}`;
      const toNumber = campaignCall.phone_number.startsWith('+')
        ? campaignCall.phone_number
        : `+${campaignCall.phone_number}`;
      const roomName = `call-${toNumber}-${Date.now()}`;

      const campaignMetadata = {
        assistantId: campaign.assistant_id,
        campaignId: campaign._id,
        campaignPrompt: campaign.campaign_prompt || '',
        contactInfo: {
          name: campaignCall.contact_name || 'Unknown',
          email: campaignCall.email || '',
          phone: campaignCall.phone_number,
        },
        source: 'outbound',
        callType: 'campaign',
      };

      // persist metadata for your webhooks (non-blocking)
      if (baseUrl && baseUrl.startsWith('http')) {
        try {
          // This endpoint likely needs to exist or be handled. 
          // Previous code called metadataUrl.
          const metadataUrl = `${baseUrl}/api/v1/campaigns/metadata/${roomName}`;
          // Use global fetch or node-fetch
          await fetch(metadataUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(campaignMetadata),
            timeout: 5000 // 5 second timeout
          });
        } catch (e) {
          console.log('⚠️ metadata post failed:', e?.message);
        }
      }

      // 4) LiveKit HTTP base for server SDKs
      const LK_HTTP_URL = process.env.LIVEKIT_HOST || process.env.LIVEKIT_URL;
      if (!LK_HTTP_URL || !LK_HTTP_URL.startsWith('http')) {
        // Just warn if missing, don't crash loop
        console.warn(`LIVEKIT_URL/HOST must be https/http for server SDKs. Got: ${LK_HTTP_URL}`);
      }

      // Dynamic import
      const { RoomServiceClient, AccessToken, AgentDispatchClient } = await import('livekit-server-sdk');
      const roomClient = new RoomServiceClient(LK_HTTP_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);
      const agentDispatchClient = new AgentDispatchClient(LK_HTTP_URL, process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET);

      // 5) ensure room exists
      try {
        console.log('🏠 Creating/verifying room', roomName);
        await roomClient.createRoom({
          name: roomName,
          metadata: JSON.stringify({
            ...campaignMetadata,
            createdAt: new Date().toISOString(),
          }),
        });
        console.log('✅ Room ok:', roomName);
      } catch (e) {
        console.log('⚠️ Room create warning (may exist):', e?.message);
      }

      // 6) DISPATCH AGENT FIRST
      const agentName = process.env.LK_AGENT_NAME || 'ai';

      // Simplified dispatch body
      const dispatchBody = {
        agent_name: agentName,
        room: roomName,
        metadata: JSON.stringify({
          phone_number: toNumber,
          agentId: campaign.assistant_id,
          callType: 'campaign',
          campaignId: campaign._id,
          contactName: campaignCall.contact_name || 'Unknown',
          campaignPrompt: campaign.campaign_prompt || '',
          outbound_trunk_id: outboundTrunkId,
        }),
      };

      console.log('🤖 Dispatching agent via AgentDispatchClient:', {
        agent_name: agentName,
        room: roomName,
        metadata: dispatchBody.metadata
      });

      const dispatchResult = await agentDispatchClient.createDispatch(roomName, agentName, {
        metadata: dispatchBody.metadata,
      });

      console.log('✅ Agent dispatch successful:', dispatchResult);

      // 10) bookkeeping
      campaignCall.call_sid = callId;
      campaignCall.room_name = roomName;
      await campaignCall.save();

      // Dials update in separate step? Original code commented out dials update.
      // Just update Campaign stats
      await Campaign.updateOne(
        { _id: campaign._id },
        {
          $inc: { total_calls_made: 1 },
          $set: { last_execution_at: new Date() }
        }
      );
      // Also update current_daily_calls (done in processCallQueue loop but doing here duplicates or confirms?)
      // processCallQueue does it. I will leave it there.

      queueItem.status = 'completed';
      queueItem.updated_at = new Date();
      await queueItem.save();

      console.log(`🎉 LiveKit SIP call initiated for ${campaign.name}: ${campaignCall.phone_number}`);
    } catch (error) {
      console.error(`Error executing call for campaign ${campaign._id}:`, error);

      // Mark call as failed
      if (queueItem && queueItem.campaign_calls) {
        queueItem.campaign_calls.status = 'failed';
        queueItem.campaign_calls.completed_at = new Date();
        queueItem.campaign_calls.notes = error.message;
        await queueItem.campaign_calls.save();
      }

      // Mark queue item as failed
      if (queueItem) {
        queueItem.status = 'failed';
        queueItem.updated_at = new Date();
        await queueItem.save();
      }

      throw error;
    }
  }

  async updateNextCallTime(campaign) {
    const now = new Date();
    const nextCallTime = new Date(now.getTime() + (30 * 1000)); // 30 seconds between calls

    campaign.next_call_at = nextCallTime;
    await campaign.save();
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId, reason) {
    await Campaign.updateOne(
      { _id: campaignId },
      {
        execution_status: 'paused',
        status: 'paused',
        updated_at: new Date()
      }
    );
    console.log(`Campaign ${campaignId} paused: ${reason}`);
  }

  async completeCampaign(campaignId) {
    await Campaign.updateOne(
      { _id: campaignId },
      {
        execution_status: 'completed',
        status: 'completed',
        updated_at: new Date()
      }
    );
    console.log(`Campaign ${campaignId} completed`);
  }

  async startCampaign(campaignId) {
    try {
      // Get campaign details
      const campaign = await Campaign.findById(campaignId);

      if (!campaign) {
        throw new Error('Campaign not found');
      }

      // Check if campaign is already running
      if (campaign.execution_status === 'running') {
        console.log(`Campaign ${campaignId} is already running`);
        return;
      }

      // Update campaign status to running
      campaign.execution_status = 'running';
      campaign.status = 'active';
      campaign.next_call_at = new Date();
      campaign.current_daily_calls = 0;
      campaign.last_execution_at = new Date();
      await campaign.save();

      console.log(`✅ Campaign ${campaignId} started with status: running, next_call_at: ${new Date().toISOString()}`);

    } catch (error) {
      console.error(`Error starting campaign ${campaignId}:`, error);
      throw error;
    }
  }
}

// Export singleton instance
export const campaignEngine = new CampaignExecutionEngine();
