import { getAccessToken } from "@/lib/auth";

import { BACKEND_URL } from "@/lib/api-config";

export interface EmailThread {
    id: string;
    senderName: string;
    senderEmail: string;
    subject: string;
    lastMessage: string;
    timestamp: string;
    assistantName: string;
    messageCount: number;
}

export interface EmailMessage {
    id: string;
    from: "assistant" | "user";
    content: string;
    timestamp: string;
    senderEmail: string;
}

export async function fetchEmailThreads(searchQuery: string = "") {
    const token = getAccessToken();
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${BACKEND_URL}/api/v1/emails/threads?search=${searchQuery}`, {
        headers
    });

    if (!res.ok) throw new Error("Failed to fetch email threads");
    return await res.json();
}

export async function fetchEmailMessages(threadId: string) {
    const token = getAccessToken();
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${BACKEND_URL}/api/v1/emails/${threadId}`, { headers });

    if (!res.ok) throw new Error("Failed to fetch email messages");
    return await res.json();
}

export async function syncEmails() {
    const token = getAccessToken();
    const headers: any = token ? { Authorization: `Bearer ${token}` } : {};

    const res = await fetch(`${BACKEND_URL}/api/v1/emails/sync`, {
        method: 'POST',
        headers
    });

    if (!res.ok) throw new Error("Failed to sync emails");
    return await res.json();
}
