// server/recording-webhook.js
import express from 'express';
import { CallHistory } from './models/index.js';

export const recordingWebhookRouter = express.Router();

/**
 * Twilio Recording Status Callback
 * POST /api/v1/recording/status
 * 
 * This endpoint receives recording status updates from Twilio
 * and updates the call_history collection with recording information
 */
recordingWebhookRouter.post('/status', async (req, res) => {
  try {
    const {
      AccountSid,
      CallSid,
      RecordingSid,
      RecordingUrl,
      RecordingStatus,
      RecordingDuration,
      RecordingChannels,
      RecordingStartTime,
      RecordingSource,
      RecordingTrack
    } = req.body;

    console.log('RECORDING_STATUS_CALLBACK', {
      AccountSid,
      CallSid,
      RecordingSid,
      RecordingStatus,
      RecordingDuration,
      RecordingUrl: RecordingUrl ? 'present' : 'missing'
    });

    // Validate required fields
    if (!CallSid || !RecordingSid || !RecordingStatus) {
      console.error('Missing required fields in recording callback', req.body);
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: CallSid, RecordingSid, RecordingStatus'
      });
    }

    // Prepare recording data for database update
    const updateData = {
      recording_sid: RecordingSid,
      recording_url: RecordingUrl || null,
      recording_status: RecordingStatus,
      recording_duration: RecordingDuration ? parseInt(RecordingDuration) : null,
      recording_channels: RecordingChannels ? parseInt(RecordingChannels) : null,
      recording_start_time: RecordingStartTime ? new Date(RecordingStartTime) : null,
      recording_source: RecordingSource || null,
      recording_track: RecordingTrack || null,
      updated_at: new Date()
    };

    // Update the CallHistory document with recording information
    const updatedCall = await CallHistory.findOneAndUpdate(
      { call_sid: CallSid },
      { $set: updateData },
      { new: true }
    );

    if (!updatedCall) {
      console.warn('No call history found for CallSid:', CallSid);
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    console.log('RECORDING_STATUS_UPDATED', {
      CallSid,
      RecordingSid,
      RecordingStatus,
      callId: updatedCall.call_id
    });

    res.json({
      success: true,
      message: 'Recording status updated successfully',
      callSid: CallSid,
      recordingSid: RecordingSid,
      status: RecordingStatus
    });

  } catch (error) {
    console.error('Recording status callback error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Get recording information for a call
 * GET /api/v1/recording/:callSid
 */
recordingWebhookRouter.get('/:callSid', async (req, res) => {
  try {
    const { callSid } = req.params;

    const recording = await CallHistory.findOne({ call_sid: callSid })
      .select('recording_sid recording_url recording_status recording_duration recording_start_time');

    if (!recording) {
      return res.status(404).json({
        success: false,
        message: 'Call not found'
      });
    }

    res.json({
      success: true,
      recording
    });

  } catch (error) {
    console.error('Get recording info error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

/**
 * Health check endpoint
 * GET /api/v1/recording/health
 */
recordingWebhookRouter.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Recording webhook service is running',
    timestamp: new Date().toISOString()
  });
});
