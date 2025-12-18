import { getAccessToken } from "@/lib/auth";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export interface EmailCampaign {
    _id: string;
    name: string;
    status: 'draft' | 'sending' | 'completed' | 'failed' | 'paused';
    subject: string;
    body: string;
    stats: {
        sent: number;
        delivered: number;
        failed: number;
        replies: number;
    };
    totalRecipients: number;
    assistantId: { _id: string; name: string } | string;
    senderEmail?: string;
    created_at: string;
}

export async function fetchEmailCampaigns() {
    const token = getAccessToken();
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${API_URL}/api/v1/email-campaigns`, { headers });
    const data = await res.json();
    return data;
}

export async function createEmailCampaign(formData: FormData) {
    const token = getAccessToken();
    const headers: any = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/email-campaigns`, {
        method: 'POST',
        headers: headers,
        body: formData
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to create campaign');
    }
    return data;
}

export async function startEmailCampaign(campaignId: string) {
    const token = getAccessToken();
    const headers: any = {
        'Content-Type': 'application/json'
    };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_URL}/api/v1/email-campaigns/${campaignId}/start`, {
        method: 'POST',
        headers: headers
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.message || 'Failed to start campaign');
    }
    return data;
}
