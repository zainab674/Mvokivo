
import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from "@/lib/api-config";
import { format } from 'date-fns';
import { Call, CallAnalysis } from "@/components/calls/types";
import { findCallInCache, addCallToCache, generateSpecificMockCall } from "../mockData/mockCallCache";

// Fetch a single call by ID via backend API
export const fetchCallById = async (id: string) => {
  try {
    console.log(`Fetching call with ID: ${id}`);

    // First attempt to find in our mock cache
    const cachedCall = findCallInCache(id);
    if (cachedCall) {
      console.log(`Found call ${id} in mock cache`);
      return cachedCall;
    }

    const token = await getAccessToken();
    if (!token) throw new Error('No authentication token found');

    const response = await fetch(`${BACKEND_URL}/api/v1/call-history/${id}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      console.log(`Call with ID ${id} not found in backend, trying to generate mock call`);
      // Logic to generate mock call if allowed/needed
      // Reuse existing fallback logic
      return handleMockFallback(id);
    }

    const call = await response.json();

    return {
      id: call.id, // Backend maps this
      first_name: call.first_name,
      last_name: call.last_name,
      name:
        (call.first_name && call.first_name !== "NA" && call.first_name.toLowerCase() !== "unknown") || (call.last_name && call.last_name !== "NA")
          ? [call.first_name, call.last_name].filter(Boolean).join(" ")
          : (call.phone_number && call.phone_number.toLowerCase() !== "unknown" ? call.phone_number : "Web Call"),
      phoneNumber: call.phone_number || '',
      date: call.created_at ? format(new Date(call.created_at), 'yyyy-MM-dd') : '',
      time: call.created_at ? format(new Date(call.created_at), 'HH:mm') : '',
      duration: call.duration || '00:00',
      direction: call.type || 'Inbound',
      channel: 'Phone',
      address: call.address || null,
      analysis: call.analysis as CallAnalysis || null,
      tags: [],
      status: call.status || 'Completed',
      resolution: call.call_outcome,
      summary: call.summary,
      transcript: call.transcript,
      call_recording: call.call_recording,
      call_sid: call.call_sid
    } as Call;

  } catch (error) {
    console.error('Error in fetchCallById, falling back to mock data generation:', error);
    return handleMockFallback(id);
  }
};

// Helper for mock fallback
const handleMockFallback = (id: string) => {
  // Try to find in default mock calls as fallback
  const call = findCallInCache(id);
  if (call) {
    console.log(`Found call ${id} in mock data`);
    return call;
  }

  // Last resort: Try to generate a specific mock call for this ID
  console.log(`Attempting last resort mock generation for ID: ${id}`);

  // Parse date from ID if possible
  let callDate = new Date();
  let callIndex = 0;

  const dateParts = id.match(/call-(\d{8})-(\d+)/);
  if (dateParts && dateParts.length === 3) {
    const dateStr = dateParts[1];
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1; // Months are 0-indexed
    const day = parseInt(dateStr.substring(6, 8));
    callDate = new Date(year, month, day);
    callIndex = parseInt(dateParts[2]);

    console.log(`Last resort: Parsed date from ID: ${callDate.toISOString()}, index: ${callIndex}`);
  }

  // Generate a mock call with this specific ID
  const mockCall = generateSpecificMockCall(id, callDate, callIndex);
  if (mockCall) {
    // Cache this call for future reference
    addCallToCache('specific-calls', mockCall);

    console.log(`Generated specific mock call for ID: ${id}`);
    return mockCall;
  }

  // If we still can't find it, throw an error
  throw new Error(`Call with ID ${id} not found in any data source`);
};
