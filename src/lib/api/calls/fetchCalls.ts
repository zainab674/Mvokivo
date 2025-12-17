import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/api-config';
import { format } from 'date-fns';
import { Call, CallAnalysis } from "@/components/calls/types";
import { getMockCalls } from "../mockData/mockCallCache";
import { fetchRecordingUrlCached } from "../recordings/fetchRecordingUrl";

// Fetch calls from backend API with fallback to mock data
export const fetchCalls = async () => {
  try {
    const token = await getAccessToken();
    if (!token) {
      console.log("No auth token, falling back to mock data");
      return getMockCalls();
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/call-history?limit=100`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.error('Failed to fetch call history:', response.status);
      throw new Error('Failed to fetch call history');
    }

    const data = await response.json();
    const calls = data.calls || (Array.isArray(data) ? data : []); // Handle both formats if backend changes

    if (calls && calls.length > 0) {
      // Transform data for UI with proper type handling
      const transformedCalls = await Promise.all(calls.map(async (call: any) => {
        // Fetch recording info if call_sid exists and no direct recording url
        // Or if we need detailed info
        const recordingInfo = call.call_sid ? await fetchRecordingUrlCached(call.call_sid) : null;

        return {
          id: call.id, // Backend now maps this
          first_name: call.first_name || '',
          last_name: call.last_name || '',
          name:
            (call.first_name && call.first_name !== "NA" && call.first_name !== "Unknown") || (call.last_name && call.last_name !== "NA")
              ? [call.first_name, call.last_name].filter(Boolean).join(" ")
              : (call.first_name || "Unknown"), // Fallback
          phoneNumber: call.phone_number || '',
          date: call.created_at ? format(new Date(call.created_at), 'yyyy-MM-dd') : '',
          time: call.created_at ? format(new Date(call.created_at), 'HH:mm') : '',
          duration: call.duration || '00:00',
          direction: call.type || 'Inbound',
          channel: 'Phone',
          address: call.address || null,
          analysis: call.analysis as CallAnalysis || null,
          tags: [],
          status: call.call_outcome || call.status || 'Completed', // Map call_outcome if status missing
          resolution: call.call_outcome,
          summary: call.summary,
          transcript: call.transcript,
          call_recording: recordingInfo?.recordingUrl || call.call_recording || '',
          call_sid: call.call_sid,
          recording_info: recordingInfo
        };
      }));

      return {
        calls: transformedCalls as Call[],
        total: transformedCalls.length,
      };
    }

    // Fallback to mock data if empty results? Or just return empty.
    // Existing logic fell back to mock if empty.
    if (calls.length === 0) {
      console.log("No data from backend, falling back to mock data");
      return getMockCalls();
    }

    return { calls: [], total: 0 };

  } catch (error) {
    console.error('Error in fetchCalls, falling back to mock data:', error);
    return getMockCalls();
  }
};
