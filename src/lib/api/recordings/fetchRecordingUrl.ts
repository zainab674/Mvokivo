import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL, getAuthHeaders } from '@/lib/api-config';

export interface RecordingInfo {
  recordingSid: string;
  recordingUrl: string;
  recordingStatus: string;
  recordingDuration: number;
  recordingChannels: number;
  recordingStartTime: string;
  recordingSource: string;
  recordingTrack: string;
}

export interface TwilioRecordingResponse {
  success: boolean;
  call: {
    sid: string;
    status: string;
    direction: string;
    from: string;
    to: string;
    startTime: string;
    endTime: string;
    duration: string;
  };
  recordings: Array<{
    sid: string;
    status: string;
    duration: string;
    channels: number;
    source: string;
    startTime: string;
    url: string;
  }>;
}

/**
 * Fetch recording URL from backend using call_sid (Bearer Auth)
 */
export const fetchRecordingUrl = async (callSid: string): Promise<RecordingInfo | null> => {
  try {
    if (!callSid) {
      console.warn('No call_sid provided for recording fetch');
      return null;
    }

    const token = await getAccessToken();

    if (!token) {
      console.error('No authentication token available');
      return null;
    }

    // Call our server API to get recording info (Bearer authenticated)
    console.log('Fetching recording for callSid:', callSid);
    const response = await fetch(
      `${BACKEND_URL}/api/v1/calls/${callSid}/recordings`,
      {
        headers: await getAuthHeaders(token)
      }
    );

    console.log('Recording API response status:', response.status);

    if (!response.ok) {
      console.error('Failed to fetch recording info from backend:', response.status, response.statusText);
      return null;
    }

    const data: TwilioRecordingResponse = await response.json();

    if (!data.success || !data.recordings || data.recordings.length === 0) {
      console.warn('No recordings found for call:', callSid);
      return null;
    }

    // Get the first (and usually only) recording
    const recording = data.recordings[0];

    // Use our proxy endpoint (Bearer authenticated on playback)
    const proxyAudioUrl = `${BACKEND_URL}/api/v1/calls/recording/${recording.sid}/audio`;

    return {
      recordingSid: recording.sid,
      recordingUrl: proxyAudioUrl,
      recordingStatus: recording.status,
      recordingDuration: parseInt(recording.duration) || 0,
      recordingChannels: recording.channels || 2,
      recordingStartTime: recording.startTime,
      recordingSource: recording.source,
      recordingTrack: 'both' // Default for dual recording
    };

  } catch (error) {
    console.error('Error fetching recording URL:', error);
    return null;
  }
};

/**
 * Fetch recording URL with caching to avoid repeated API calls (exactly like voiceagents)
 */
const recordingCache = new Map<string, RecordingInfo | null>();

export const fetchRecordingUrlCached = async (callSid: string): Promise<RecordingInfo | null> => {
  // Check cache first
  if (recordingCache.has(callSid)) {
    return recordingCache.get(callSid) || null;
  }

  // Fetch from API
  const recording = await fetchRecordingUrl(callSid);

  // Cache the result (even if null to avoid repeated failed requests)
  recordingCache.set(callSid, recording);

  return recording;
};
