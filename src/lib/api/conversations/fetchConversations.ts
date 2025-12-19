
import { getAccessToken } from "@/lib/auth";
import { format } from 'date-fns';
import { Conversation } from "@/components/conversations/types";
import { fetchRecordingUrlCached } from "../recordings/fetchRecordingUrl";
import { SMSMessage } from "@/lib/api/sms/smsService";
import { formatPhoneNumber } from "@/utils/formatUtils";
import { getCurrentUserIdAsync } from "@/lib/user-context";

export interface CallHistoryRecord {
  id: string;
  call_id: string;
  assistant_id: string;
  phone_number: string;
  participant_identity: string;
  start_time: string;
  end_time: string;
  call_duration: number;
  call_status: string;
  transcription: Array<{ role: string; content: any }>;
  call_sid?: string;
  recording_sid?: string;
  call_summary?: string;
  success_evaluation?: string;
  structured_data?: any;
  created_at: string;
  updated_at: string;
}

export interface ConversationsResponse {
  conversations: Conversation[];
  total: number;
}

export interface ContactSummary {
  id: string;
  phoneNumber: string;
  displayName: string;
  firstName: string;
  lastName: string;
  lastActivityDate: string;
  lastActivityTime: string;
  lastActivityTimestamp: Date;
  totalCalls: number;
  totalSMS: number;
  lastCallOutcome?: string;
  totalDuration: string;
  outcomes: {
    appointments: number;
    qualified: number;
    notQualified: number;
    spam: number;
  };
  hasNewMessages?: boolean;
  hasNewSMS?: boolean;
  hasNewCalls?: boolean;
  avatarUrl?: string;
  isOnline?: boolean;
}


export interface ConversationDetailsResponse {
  conversation: Conversation;
  hasMoreHistory: boolean;
  nextOffset: number;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || (import.meta.env.PROD ? 'https://backend.vokivo.com' : 'http://localhost:4000');


function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function calculateTotalDuration(calls: any[]): string {
  const totalSeconds = calls.reduce((acc, call) => {
    const durationStr = call.duration || '0:00';
    const [m, s] = durationStr.split(':').map(Number);
    return acc + (m * 60 + (s || 0));
  }, 0);
  return formatDuration(totalSeconds);
}

function determineCallResolution(transcription: any, status: string, manualOutcome?: string, confidence?: number): string {
  // Use existing logic or simplify
  if (manualOutcome) return manualOutcome;
  if (status === 'completed') return 'Completed';
  if (status === 'no-answer') return 'No Answer';
  if (status === 'busy') return 'Busy';
  if (status === 'failed') return 'Failed';
  return 'Unknown';
}


/**
 * Get user assistants from backend
 */
async function getUserAssistantIds(): Promise<string[]> {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    const response = await fetch(`${BACKEND_URL}/api/v1/assistants`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) return [];
    const data = await response.json();
    // Assuming backend returns { assistants: [...] }
    return data.assistants?.map((a: any) => a.id) || [];
  } catch (error) {
    console.error('Error fetching user assistants:', error);
    return [];
  }
}

/**
 * Fetch contacts list using backend APIs
 */
export const fetchContactList = async (limit: number = 50): Promise<ContactSummary[]> => {
  try {
    const token = await getAccessToken();
    if (!token) return [];

    console.log('📋 Fetching contact list via backend...');

    // Parallel fetch: Call History + SMS Messages
    const [callsResponse, smsResponse] = await Promise.all([
      fetch(`${BACKEND_URL}/api/v1/call-history?limit=${limit * 10}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${BACKEND_URL}/api/v1/twilio/sms/messages?limit=${limit * 5}`, {
        // Fetch simplified SMS list if possible or just use messages endpoint
        // Note: /messages returns individual messages. Ideally we'd have an aggregated endpoint.
        // For now we fetch recent messages to extract contacts.
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    let callHistory: any[] = [];
    if (callsResponse.ok) {
      const data = await callsResponse.json();
      callHistory = data.calls || [];
    }

    let smsMessages: any[] = [];
    if (smsResponse.ok) {
      const data = await smsResponse.json();
      smsMessages = data.messages || [];
    }

    // Group calls by phone number
    const contactsMap = new Map<string, {
      phoneNumber: string;
      participantIdentity: string;
      lastActivity: Date;
      calls: any[];
      totalDuration: number;
      lastCallOutcome?: string;
    }>();

    callHistory.forEach(call => {
      const phoneNumber = call.phone_number;
      if (!phoneNumber) return;

      const callTime = new Date(call.started_at || call.created_at);

      // Determine contact name from structured data or fallback
      let contactName = formatPhoneNumber(phoneNumber);
      let hasStructuredName = false;

      // Use backend structured_data if available
      if (call.structured_data && typeof call.structured_data === 'object') {
        // simplified logic: check 'name' or similar fields
        const sd = call.structured_data;
        const extracted = sd.name || sd.contact_name || sd.Customer_Name || sd['Customer Name'];
        if (extracted && typeof extracted === 'string') {
          contactName = `${extracted} - ${formatPhoneNumber(phoneNumber)}`;
          hasStructuredName = true;
        }
      }

      if (!contactsMap.has(phoneNumber)) {
        contactsMap.set(phoneNumber, {
          phoneNumber,
          participantIdentity: contactName,
          lastActivity: callTime,
          calls: [],
          totalDuration: 0,
          lastCallOutcome: undefined
        });
      }

      const contact = contactsMap.get(phoneNumber)!;
      contact.calls.push(call);
      // Backend duration is formatted string 'MM:SS' or number? 
      // Backend call-history.js formats duration as string.
      // We need seconds for totalDuration calculation?
      // Let's assume backend returns "MM:SS" string or number.
      // If string, parse it.
      let durationSecs = 0;
      if (typeof call.duration === 'string') {
        const parts = call.duration.split(':');
        durationSecs = parseInt(parts[0]) * 60 + (parseInt(parts[1]) || 0);
      } else if (typeof call.duration === 'number') {
        durationSecs = call.duration;
      }

      contact.totalDuration += durationSecs;

      if (callTime > contact.lastActivity) {
        contact.lastActivity = callTime;
        contact.lastCallOutcome = determineCallResolution(call.transcript || call.transcription, call.call_status || call.status, call.call_outcome || call.status);
        // Update identity if we found a better name
        if (hasStructuredName) {
          contact.participantIdentity = contactName;
        }
      }
    });

    // Process SMS for contacts
    const smsCountsMap = new Map<string, number>();
    smsMessages.forEach(sms => {
      const phoneNumber = sms.direction === 'inbound' ? sms.from : sms.to;
      if (!phoneNumber) return;
      smsCountsMap.set(phoneNumber, (smsCountsMap.get(phoneNumber) || 0) + 1);

      // Add SMS-only contacts? 
      if (!contactsMap.has(phoneNumber)) {
        contactsMap.set(phoneNumber, {
          phoneNumber,
          participantIdentity: formatPhoneNumber(phoneNumber),
          lastActivity: new Date(sms.dateCreated),
          calls: [],
          totalDuration: 0,
          lastCallOutcome: undefined
        });
      } else {
        const contact = contactsMap.get(phoneNumber)!;
        const smsTime = new Date(sms.dateCreated);
        if (smsTime > contact.lastActivity) {
          contact.lastActivity = smsTime;
        }
      }
    });

    // Convert map to array
    const contacts: ContactSummary[] = Array.from(contactsMap.values())
      .map((contact, index) => {
        const displayName = contact.participantIdentity;
        const nameParts = displayName.split(' ');

        return {
          id: `contact_${contact.phoneNumber}`,
          phoneNumber: contact.phoneNumber,
          displayName,
          firstName: nameParts[0] || 'Unknown',
          lastName: nameParts.slice(1).join(' ') || '',
          lastActivityDate: format(contact.lastActivity, 'yyyy-MM-dd'),
          lastActivityTime: format(contact.lastActivity, 'HH:mm'),
          lastActivityTimestamp: contact.lastActivity,
          totalCalls: contact.calls.length,
          totalSMS: smsCountsMap.get(contact.phoneNumber) || 0,
          lastCallOutcome: contact.lastCallOutcome,
          totalDuration: formatDuration(contact.totalDuration),
          outcomes: {
            appointments: 0,
            qualified: 0,
            notQualified: 0,
            spam: 0
          },
          avatarUrl: undefined,
          isOnline: false,
          hasNewMessages: false
        };
      })
      .sort((a, b) => b.lastActivityTimestamp.getTime() - a.lastActivityTimestamp.getTime())
      .slice(0, limit);

    return contacts;
  } catch (error) {
    console.error('Error fetching contact list:', error);
    return [];
  }
};

/**
 * Fetch conversation details for a specific phone number
 */
export const fetchConversationDetails = async (
  phoneNumber: string,
  days: number | null = null
): Promise<ConversationDetailsResponse> => {
  try {
    const token = await getAccessToken();
    if (!token) throw new Error("Not authenticated");

    // Fetch calls for phone number
    const callsUrl = new URL(`${BACKEND_URL}/api/v1/call-history`);
    callsUrl.searchParams.append('phoneNumber', phoneNumber);
    if (days) {
      // Backend might not support days filter yet, but we can filter client side or add it.
      // For now, fetching all calls for number (usually not that many)
    }

    // Fetch SMS for phone number (conversation)
    // We use conversationId convention 'conv_+1234567890'
    const conversationId = `conv_${phoneNumber}`;
    const smsUrl = `${BACKEND_URL}/api/v1/twilio/sms/conversation/${conversationId}`;

    const [callsResponse, smsResponse] = await Promise.all([
      fetch(callsUrl.toString(), { headers: { 'Authorization': `Bearer ${token}` } }),
      fetch(smsUrl, { headers: { 'Authorization': `Bearer ${token}` } })
    ]);

    let calls: any[] = [];
    if (callsResponse.ok) {
      const data = await callsResponse.json();
      calls = data.calls || [];
    }

    let smsMessages: any[] = [];
    if (smsResponse.ok) {
      const data = await smsResponse.json();
      smsMessages = data.data || [];
    }

    // Merge and create Conversation object
    // Map calls to CallData format
    const processedCalls = calls.map((call: any) => ({
      id: call.call_id || call._id || call.id,
      name: call.first_name ? `${call.first_name} ${call.last_name || ''}` : formatPhoneNumber(call.phone_number || phoneNumber),
      phoneNumber: call.phone_number || phoneNumber,
      date: format(new Date(call.started_at || call.created_at || Date.now()), 'yyyy-MM-dd'),
      time: format(new Date(call.started_at || call.created_at || Date.now()), 'HH:mm'),
      duration: typeof call.duration === 'string' ? call.duration : formatDuration(call.call_duration || call.duration || 0),
      direction: 'inbound' as const,
      channel: 'voice' as const, // Added missing property
      tags: [], // Added missing property
      status: call.status || call.call_status,
      resolution: determineCallResolution(call.transcript || call.transcription, call.status || call.call_status),
      call_recording: call.call_recording || call.recording_url || '',
      summary: call.summary || call.call_summary,
      transcript: (() => {
        const rawTranscript = call.transcript || call.transcription;
        if (!rawTranscript) return null;

        let transcriptArray = typeof rawTranscript === 'string' ? JSON.parse(rawTranscript) : rawTranscript;

        if (Array.isArray(transcriptArray)) {
          return transcriptArray.map((entry: any) => ({
            speaker: entry.speaker || (entry.role === 'assistant' ? 'Agent' : entry.role === 'user' ? 'Customer' : entry.role) || 'Unknown',
            text: entry.text || entry.content || '',
            time: entry.time || ''
          }));
        }
        return transcriptArray;
      })(),
      analysis: call.analysis || call.structured_data,
      created_at: call.created_at || call.started_at,
      assistant_id: call.assistant_id
    }));

    const conversation: Conversation = {
      id: conversationId,
      contactId: `contact_${phoneNumber}`,
      phoneNumber: phoneNumber,
      firstName: 'Unknown',
      lastName: '',
      displayName: formatPhoneNumber(phoneNumber),
      totalCalls: processedCalls.length,
      totalSMS: smsMessages.length,
      lastActivityDate: '',
      lastActivityTime: '',
      lastActivityTimestamp: new Date(),
      calls: processedCalls,
      smsMessages: smsMessages.map((sms: any) => ({
        messageSid: sms.messageSid,
        to: sms.to,
        from: sms.from,
        body: sms.body,
        direction: sms.direction,
        status: sms.status,
        dateCreated: sms.dateCreated,
        dateUpdated: sms.dateUpdated || sms.dateCreated // Added missing property
      })),
      totalDuration: calculateTotalDuration(processedCalls),
      outcomes: { appointments: 0, qualified: 0, notQualified: 0, spam: 0 }
    };

    // Determine last activity
    // ... (simplified logic) ...

    return {
      conversation,
      hasMoreHistory: false,
      nextOffset: 0
    };

  } catch (error) {
    console.error('Error fetching conversation details:', error);
    throw error;
  }
}

/**
 * Progressive loading function - returns contacts list and functions for loading details
 */
export const getConversationsProgressive = async () => {
  const contacts = await fetchContactList();

  return {
    contacts,
    getConversationDetails: fetchConversationDetails,
    loadMoreHistory: async (phoneNumber: string, offset: number = 0, limit: number = 50) => {
      // Placeholder for loading more history - can be implemented later
      console.log(`Loading more history for ${phoneNumber}, offset: ${offset}, limit: ${limit}`);
      return { calls: [], smsMessages: [], hasMore: false };
    },
    fetchNewMessagesSince: async (phoneNumber: string, sinceTimestamp: string) => {
      // Placeholder for fetching new messages - can be implemented later
      console.log(`Fetching new messages for ${phoneNumber} since ${sinceTimestamp}`);
      return { newSMSMessages: [], newCalls: [], hasNewData: false };
    }
  };
};

// Deprecated function - keeping dummy signature for now or remove if not used
export const fetchConversations = async (shouldSort: boolean = true): Promise<ConversationsResponse> => {
  console.warn("fetchConversations is deprecated. Use fetchContactList instead.");
  return { conversations: [], total: 0 };
}
