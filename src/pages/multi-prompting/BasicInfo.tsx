import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import DashboardLayout from "@/layout/DashboardLayout";
import { ThemeContainer } from "@/components/theme";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Mic,
    Sparkles,
    ArrowRight,
    ArrowLeft,
    Loader2,
    AlertCircle,
    FileText
} from 'lucide-react';
import { multiPrompting as apiService } from '@/lib/api/apiService';
import type { OptionsCatalog, CreateMultiPromptingAgentData, MultiPromptingAgent } from '@/lib/api/multiPrompting';
import PageHeader from '@/components/ui/page-header';

const WorkflowBasicInfo: React.FC = () => {
    const navigate = useNavigate();
    const { agentId } = useParams<{ agentId: string }>();
    const isEditMode = Boolean(agentId);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [agentOptions, setAgentOptions] = useState<OptionsCatalog | null>(null);
    const [formDataLoaded, setFormDataLoaded] = useState(false);
    const [isLoadingFromStorage, setIsLoadingFromStorage] = useState(false);
    const [forceUpdate, setForceUpdate] = useState(0);
    const [existingAgent, setExistingAgent] = useState<MultiPromptingAgent | null>(null);

    const [formData, setFormData] = useState<CreateMultiPromptingAgentData>({
        name: '',
        description: '',
        context: '',
        global_prompt: '',
        tts_engine: '',
        tts_model: '',
        tts_voice: '',
        tts_language: '',
        stt_engine: '',
        stt_model: '',
        stt_language: '',
        is_knowledge_base_connected: false,
        knowledge_base_id: '',
        llm_engine: '',
        llm_model: '',
        temperature: 0.7,
        max_output: 500,
        agent_type: 'multi-prompting',
        nodes: []
    });

    useEffect(() => {
        fetchAgentOptions();
        if (isEditMode && agentId) {
            fetchExistingAgent(agentId);
        }
    }, [isEditMode, agentId]);

    useEffect(() => {
        if (agentOptions && !formDataLoaded && !isEditMode) {
            const savedBasicInfo = sessionStorage.getItem('workflowBasicInfo');
            if (savedBasicInfo) {
                try {
                    const parsedData = JSON.parse(savedBasicInfo);
                    setIsLoadingFromStorage(true);
                    setForceUpdate(prev => prev + 1);
                    setFormData({
                        ...parsedData,
                        tts_engine: parsedData.tts_engine || '',
                        tts_model: parsedData.tts_model || '',
                        tts_voice: parsedData.tts_voice || '',
                        stt_engine: parsedData.stt_engine || '',
                        stt_model: parsedData.stt_model || '',
                        llm_engine: parsedData.llm_engine || '',
                        llm_model: parsedData.llm_model || '',
                    });
                    setTimeout(() => {
                        setIsLoadingFromStorage(false);
                        setFormDataLoaded(true);
                    }, 100);
                } catch (err) {
                    setFormDataLoaded(true);
                }
            } else {
                setFormDataLoaded(true);
            }
        }
    }, [agentOptions, formDataLoaded, isEditMode]);

    useEffect(() => {
        if (agentOptions && existingAgent && !formDataLoaded && isEditMode) {
            setIsLoadingFromStorage(true);
            setForceUpdate(prev => prev + 1);
            setFormData({
                name: existingAgent.name || '',
                description: existingAgent.description || '',
                context: existingAgent.context || '',
                global_prompt: existingAgent.global_prompt || '',
                tts_engine: existingAgent.tts_engine || '',
                tts_model: existingAgent.tts_model || '',
                tts_voice: existingAgent.tts_voice || '',
                tts_language: existingAgent.tts_language || '',
                stt_engine: existingAgent.stt_engine || '',
                stt_model: existingAgent.stt_model || '',
                stt_language: existingAgent.stt_language || '',
                is_knowledge_base_connected: existingAgent.is_knowledge_base_connected || false,
                knowledge_base_id: existingAgent.knowledge_base_id || '',
                llm_engine: existingAgent.llm_engine || '',
                llm_model: existingAgent.llm_model || '',
                temperature: existingAgent.temperature || 0.7,
                max_output: existingAgent.max_output || 500,
                agent_type: existingAgent.agent_type || 'multi-prompting',
                nodes: existingAgent.nodes || []
            });
            setTimeout(() => {
                setIsLoadingFromStorage(false);
                setFormDataLoaded(true);
            }, 100);
        }
    }, [agentOptions, existingAgent, formDataLoaded, isEditMode]);

    const fetchAgentOptions = async () => {
        try {
            const options = await apiService.getAgentOptions();
            setAgentOptions(options);
        } catch (err) {
            setError('Failed to load configuration options');
        }
    };

    const fetchExistingAgent = async (id: string) => {
        try {
            setLoading(true);
            const agent = await apiService.getMultiPromptingAgent(id);
            setExistingAgent(agent);
        } catch (err) {
            setError('Failed to fetch agent data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (field: keyof CreateMultiPromptingAgentData, value: any) => {
        setFormData(prev => {
            const newData = { ...prev, [field]: value };
            if (!isLoadingFromStorage) {
                if (field === 'tts_engine') { newData.tts_model = ''; newData.tts_voice = ''; }
                if (field === 'tts_model') { newData.tts_voice = ''; }
                if (field === 'stt_engine') { newData.stt_model = ''; }
                if (field === 'llm_engine') { newData.llm_model = ''; }
            }
            return newData;
        });
    };

    const getAvailableVoices = (ttsEngine: string, ttsModel: string) => {
        if (!agentOptions || !ttsEngine || !ttsModel) return [];
        const engine = agentOptions.tts?.find(e => e.value === ttsEngine);
        const model = engine?.models?.find(m => m.value === ttsModel);
        return model?.voices || [];
    };

    const handleNext = () => {
        if (!formData.name || !formData.context || !formData.tts_engine || !formData.llm_model) {
            setError('Please fill in all required fields');
            return;
        }

        if (isEditMode) {
            navigate(`/workflows/edit/${agentId}/flow`);
        } else {
            sessionStorage.setItem('workflowBasicInfo', JSON.stringify(formData));
            navigate('/workflows/create/flow');
        }
    };

    return (
        <DashboardLayout>
            <ThemeContainer variant="base" className="min-h-screen">
                <div className="max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    <div className="flex items-center justify-between mb-4">
                        <Button variant="ghost" onClick={() => navigate('/workflows')} className="text-muted-foreground">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Workflows
                        </Button>
                    </div>

                    <PageHeader
                        title={isEditMode ? "Edit Workflow Details" : "Create New Workflow"}
                        description="Configure the basic engine settings for your AI agent"
                    />

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }} className="space-y-6">
                        <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-xl">
                                    <FileText className="h-5 w-5 text-primary" /> Basic Information
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Workflow Name *</Label>
                                    <Input
                                        id="name"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        placeholder="e.g., Customer Support Flow"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) => handleInputChange('description', e.target.value)}
                                        placeholder="Briefly describe what this workflow does"
                                        rows={2}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="context">Base Context / System Prompt *</Label>
                                    <Textarea
                                        id="context"
                                        value={formData.context}
                                        onChange={(e) => handleInputChange('context', e.target.value)}
                                        placeholder="General instructions for the AI agent..."
                                        rows={6}
                                        required
                                    />
                                </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Voice Settings */}
                            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Mic className="h-5 w-5 text-emerald-500" /> Voice (TTS)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Engine</Label>
                                        <Select value={formData.tts_engine || undefined} onValueChange={(v) => handleInputChange('tts_engine', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select Engine" /></SelectTrigger>
                                            <SelectContent>
                                                {agentOptions?.tts?.map(e => <SelectItem key={e.value} value={e.value}>{e.key}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Model</Label>
                                        <Select value={formData.tts_model || undefined} onValueChange={(v) => handleInputChange('tts_model', v)} disabled={!formData.tts_engine}>
                                            <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                                            <SelectContent>
                                                {agentOptions?.tts?.find(e => e.value === formData.tts_engine)?.models?.map(m => <SelectItem key={m.value} value={m.value}>{m.key}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Voice</Label>
                                        <Select value={formData.tts_voice || undefined} onValueChange={(v) => handleInputChange('tts_voice', v)} disabled={!formData.tts_model}>
                                            <SelectTrigger><SelectValue placeholder="Select Voice" /></SelectTrigger>
                                            <SelectContent>
                                                {getAvailableVoices(formData.tts_engine, formData.tts_model).map(v => <SelectItem key={v.value} value={v.value}>{v.key}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Intelligence Settings */}
                            <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Sparkles className="h-5 w-5 text-purple-500" /> Intelligence (LLM)
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="space-y-2">
                                        <Label>Engine</Label>
                                        <Select value={formData.llm_engine || undefined} onValueChange={(v) => handleInputChange('llm_engine', v)}>
                                            <SelectTrigger><SelectValue placeholder="Select Engine" /></SelectTrigger>
                                            <SelectContent>
                                                {agentOptions?.llm?.map(e => <SelectItem key={e.value} value={e.value}>{e.key}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Model</Label>
                                        <Select value={formData.llm_model || undefined} onValueChange={(v) => handleInputChange('llm_model', v)} disabled={!formData.llm_engine}>
                                            <SelectTrigger><SelectValue placeholder="Select Model" /></SelectTrigger>
                                            <SelectContent>
                                                {agentOptions?.llm?.find(e => e.value === formData.llm_engine)?.models?.map(m => <SelectItem key={m.value} value={m.value}>{m.key}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Temperature</Label>
                                            <Input type="number" step="0.1" value={formData.temperature} onChange={(e) => handleInputChange('temperature', parseFloat(e.target.value))} />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Max Tokens</Label>
                                            <Input type="number" value={formData.max_output} onChange={(e) => handleInputChange('max_output', parseInt(e.target.value))} />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="flex justify-end gap-4">
                            <Button variant="outline" onClick={() => navigate('/workflows')} type="button">Cancel</Button>
                            <Button type="submit" disabled={loading} className="px-8 shadow-lg shadow-primary/20">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                Next: Build Flow <ArrowRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>
                    </form>
                </div>
            </ThemeContainer>
        </DashboardLayout>
    );
};

export default WorkflowBasicInfo;
