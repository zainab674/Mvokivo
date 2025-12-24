
import { getAccessToken } from '@/lib/auth';
import { BACKEND_URL } from '@/lib/api-config';

// Multi-Prompting Agent Types
export interface NodeTransition {
    condition_description: string;
    to: string;
    tool_name?: string;
}

export interface NodeCreate {
    type: 'start' | 'task' | 'end' | 'transfer';
    title: string;
    input_prompt?: string;
    first_dialogue?: string;
    description?: string;
    transitions?: NodeTransition[];
    connected_from: string[];
    connected_to: string[];
    context?: boolean;
}

export interface Node extends NodeCreate {
    id: string;
}

export interface MultiPromptingAgent {
    id: string;
    _id?: string;
    name: string;
    description: string;
    context: string;
    global_prompt?: string;
    tts_engine: string;
    tts_model: string;
    tts_voice: string;
    tts_language: string;
    stt_engine: string;
    stt_model: string;
    stt_language: string;
    is_knowledge_base_connected: boolean;
    knowledge_base_id?: string;
    llm_engine: string;
    llm_model: string;
    temperature: number;
    max_output: number;
    agent_type: string;
    nodes: Node[];
    placeholders: string[];
    user_id?: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateMultiPromptingAgentData {
    name: string;
    description: string;
    context: string;
    global_prompt?: string;
    tts_engine: string;
    tts_model: string;
    tts_voice: string;
    tts_language: string;
    stt_engine: string;
    stt_model: string;
    stt_language: string;
    is_knowledge_base_connected: boolean;
    knowledge_base_id?: string;
    llm_engine: string;
    llm_model: string;
    temperature: number;
    max_output: number;
    agent_type: string;
    nodes: NodeCreate[];
}

export interface MultiPromptingAgentListResponse {
    agents: MultiPromptingAgent[];
    has_more: boolean;
    total_count: number;
}

export interface OptionsCatalog {
    id?: string;
    support_languages?: {
        tts: Array<{ key: string; value: string; is_active?: boolean }>;
        stt: Array<{ key: string; value: string; is_active?: boolean }>;
    };
    max_token?: number[];
    temperature?: number[];
    llm?: Array<{
        key: string;
        value: string;
        is_active: boolean;
        models: Array<{ key: string; value: string; is_active?: boolean }>;
    }>;
    stt?: Array<{
        key: string;
        value: string;
        is_active: boolean;
        models: Array<{ key: string; value: string; is_active?: boolean }>;
    }>;
    tts?: Array<{
        key: string;
        value: string;
        is_active: boolean;
        models: Array<{
            key: string;
            value: string;
            is_active?: boolean;
            voices?: Array<{ key: string; value: string; is_active?: boolean }>;
        }>;
    }>;
}

export const getMultiPromptingAgents = async (page: number = 1, limit: number = 20, search?: string, filterParams?: URLSearchParams): Promise<MultiPromptingAgentListResponse> => {
    const token = await getAccessToken();
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());
    if (search) params.append('search', search);

    if (filterParams) {
        filterParams.forEach((value, key) => {
            if (value !== 'all' && value !== '') {
                params.append(key, value);
            }
        });
    }

    const response = await fetch(`${BACKEND_URL}/api/v1/agentmultiprompting/?${params.toString()}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) throw new Error('Failed to fetch multi-prompting agents');
    return response.json();
};

export const getMultiPromptingAgent = async (agentId: string): Promise<MultiPromptingAgent> => {
    const token = await getAccessToken();
    const response = await fetch(`${BACKEND_URL}/api/v1/agentmultiprompting/${agentId}`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) throw new Error('Failed to fetch multi-prompting agent');
    const data = await response.json();
    return data;
};

export const createMultiPromptingAgent = async (agent: CreateMultiPromptingAgentData): Promise<MultiPromptingAgent> => {
    const token = await getAccessToken();
    const response = await fetch(`${BACKEND_URL}/api/v1/agentmultiprompting/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(agent)
    });

    if (!response.ok) throw new Error('Failed to create multi-prompting agent');
    const result = await response.json();
    return result.data;
};

export const updateMultiPromptingAgent = async (agentId: string, agent: Partial<CreateMultiPromptingAgentData>): Promise<MultiPromptingAgent> => {
    const token = await getAccessToken();
    const response = await fetch(`${BACKEND_URL}/api/v1/agentmultiprompting/${agentId}`, {
        method: 'PUT',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(agent)
    });

    if (!response.ok) throw new Error('Failed to update multi-prompting agent');
    const result = await response.json();
    return result.data;
};

export const deleteMultiPromptingAgent = async (agentId: string): Promise<void> => {
    const token = await getAccessToken();
    const response = await fetch(`${BACKEND_URL}/api/v1/agentmultiprompting/${agentId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${token}`
        }
    });

    if (!response.ok) throw new Error('Failed to delete multi-prompting agent');
};

export const getAgentOptions = async (): Promise<OptionsCatalog> => {
    // Try to find if there's already an options endpoint in MananUltratalk
    const token = await getAccessToken();
    const response = await fetch(`${BACKEND_URL}/api/v1/agent-options/`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        }
    });

    if (!response.ok) throw new Error('Failed to fetch agent options');
    return response.json();
};
