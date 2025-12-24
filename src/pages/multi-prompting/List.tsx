import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from "@/layout/DashboardLayout";
import { ThemeContainer } from "@/components/theme";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import {
    Plus,
    AlertCircle,
    Trash2,
    Loader2,
    Search,
    Workflow
} from 'lucide-react';
import { multiPrompting as apiService } from '@/lib/api/apiService';
import type { MultiPromptingAgent, OptionsCatalog } from '@/lib/api/multiPrompting';
import PageHeader from '@/components/ui/page-header';

const MultiPromptingAgents: React.FC = () => {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<MultiPromptingAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [deletingAgents, setDeletingAgents] = useState<Set<string>>(new Set());
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState<MultiPromptingAgent | null>(null);

    // Agent options state
    const [agentOptions, setAgentOptions] = useState<OptionsCatalog | null>(null);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMore, setHasMore] = useState(false);
    const [totalCount, setTotalCount] = useState(0);
    const [loadingMore, setLoadingMore] = useState(false);

    // Search state
    const [searchTerm, setSearchTerm] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Filter state
    const [ttsEngineFilter, setTtsEngineFilter] = useState<string>('all');
    const [sttEngineFilter, setSttEngineFilter] = useState<string>('all');
    const [llmEngineFilter, setLlmEngineFilter] = useState<string>('all');

    useEffect(() => {
        fetchAgents();
        fetchAgentOptions();
    }, []);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchTerm !== '') {
                setIsSearching(true);
                fetchAgents(1, false).finally(() => setIsSearching(false));
            } else {
                fetchAgents(1, false);
            }
        }, 500);

        return () => clearTimeout(timeoutId);
    }, [searchTerm]);

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            fetchAgents(1, false);
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [ttsEngineFilter, sttEngineFilter, llmEngineFilter]);

    const fetchAgentOptions = async () => {
        try {
            const options = await apiService.getAgentOptions();
            setAgentOptions(options);
        } catch (err) {
            console.error('Error fetching agent options:', err);
        }
    };

    const fetchAgents = async (page: number = 1, append: boolean = false) => {
        try {
            if (append) {
                setLoadingMore(true);
            } else {
                setLoading(true);
            }
            setError(null);

            // Build filter parameters
            const filterParams = new URLSearchParams();
            if (ttsEngineFilter !== 'all') filterParams.append('tts_engine', ttsEngineFilter);
            if (sttEngineFilter !== 'all') filterParams.append('stt_engine', sttEngineFilter);
            if (llmEngineFilter !== 'all') filterParams.append('llm_engine', llmEngineFilter);

            const data = await apiService.getMultiPromptingAgents(page, 20, searchTerm, filterParams);

            if (append) {
                setAgents(prev => [...prev, ...data.agents]);
            } else {
                setAgents(data.agents);
            }

            setHasMore(data.has_more);
            setTotalCount(data.total_count);
            setCurrentPage(page);

            if (data.agents.length === 0 && page > 1 && !append) {
                await fetchAgents(page - 1, false);
            }
        } catch (err) {
            console.error('Error fetching multi-prompting agents:', err);
            setError(err instanceof Error ? err.message : 'Failed to fetch agents');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    const loadMoreAgents = () => {
        if (hasMore && !loadingMore) {
            fetchAgents(currentPage + 1, true);
        }
    };

    const handleDeleteAgent = (agent: MultiPromptingAgent, e?: React.MouseEvent) => {
        e?.preventDefault();
        e?.stopPropagation();
        setAgentToDelete(agent);
        setDeleteDialogOpen(true);
    };

    const confirmDeleteAgent = async () => {
        if (!agentToDelete) return;

        const agentId = agentToDelete.id || agentToDelete._id;
        if (!agentId) {
            setError('Agent ID is missing');
            return;
        }

        try {
            setDeletingAgents(prev => new Set(prev).add(agentId));
            setError(null);

            await apiService.deleteMultiPromptingAgent(agentId);

            setAgents(prev => prev.filter(agent => (agent.id || agent._id) !== agentId));
            setTotalCount(prev => Math.max(0, prev - 1));
            await fetchAgents(1, false);

            setDeleteDialogOpen(false);
            setAgentToDelete(null);
        } catch (err) {
            console.error('Error deleting agent:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete agent');
        } finally {
            setDeletingAgents(prev => {
                const newSet = new Set(prev);
                newSet.delete(agentId);
                return newSet;
            });
        }
    };

    // Helper Functions
    const getVoiceDisplayName = (ttsEngine: string, ttsModel: string, voiceName: string) => {
        if (!ttsEngine || !voiceName || !agentOptions) return voiceName;
        const ttsEngineData = agentOptions.tts?.find(engine => engine.value === ttsEngine);
        if (!ttsEngineData) return voiceName;
        const model = ttsEngineData.models?.find(m => m.value === ttsModel);
        if (!model) return voiceName;
        const voice = model.voices?.find(v => v.value === voiceName);
        return voice ? voice.key : voiceName;
    };

    const getTTSEngineDisplayName = (ttsEngine: string) => {
        if (!agentOptions) return ttsEngine;
        const engine = agentOptions.tts?.find(e => e.value === ttsEngine);
        return engine ? engine.key : ttsEngine;
    };

    const getNodeTypeCounts = (nodes: any[]) => {
        const counts = { start: 0, task: 0, transfer: 0, end: 0 };
        if (!Array.isArray(nodes)) return counts;
        nodes.forEach(node => {
            if (counts.hasOwnProperty(node.type)) {
                counts[node.type as keyof typeof counts]++;
            }
        });
        return counts;
    };

    return (
        <DashboardLayout>
            <ThemeContainer variant="base" className="min-h-screen">
                <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
                    <PageHeader
                        title="Workflows"
                        description="Manage your advanced AI agents with complex conversation nodes"
                        tooltipTitle="Workflow Builder"
                        tooltipDescription="Create sophisticated agents with multiple conversation paths, conditions, and decision trees using a visual node builder."
                    >
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative w-full sm:w-48">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                <Input
                                    type="text"
                                    placeholder="Search..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 h-10"
                                />
                            </div>
                            <Button
                                onClick={() => navigate('/workflows/create/basic-info')}
                                className="w-full sm:w-auto"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Create Workflow
                            </Button>
                        </div>
                    </PageHeader>

                    {error && (
                        <Alert variant="destructive">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}

                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {[...Array(6)].map((_, i) => (
                                <Card key={i}>
                                    <CardHeader>
                                        <Skeleton className="h-6 w-24 mb-2" />
                                        <Skeleton className="h-4 w-32" />
                                    </CardHeader>
                                    <CardContent>
                                        <Skeleton className="h-20 w-full" />
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    ) : agents.length > 0 ? (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {agents.map((agent) => {
                                    const nodeCounts = getNodeTypeCounts(agent.nodes);
                                    const agentId = agent.id || agent._id || '';

                                    return (
                                        <Card key={agentId} className="hover:shadow-md transition-shadow group relative border-border/50 bg-card/50 backdrop-blur-sm">
                                            <CardHeader className="pb-3">
                                                <div className="flex items-start justify-between">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center border border-primary/20">
                                                            <Workflow className="h-5 w-5 text-primary" />
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-lg font-bold line-clamp-1">{agent.name}</CardTitle>
                                                            <p className="text-xs text-muted-foreground">
                                                                {getVoiceDisplayName(agent.tts_engine, agent.tts_model, agent.tts_voice)}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={(e) => handleDeleteAgent(agent, e)}
                                                        disabled={deletingAgents.has(agentId)}
                                                        className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        {deletingAgents.has(agentId) ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Trash2 className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                </div>
                                            </CardHeader>
                                            <CardContent
                                                className="cursor-pointer"
                                                onClick={() => navigate(`/workflows/edit/${agentId}/flow`)}
                                            >
                                                <p className="text-sm text-muted-foreground mb-4 line-clamp-2 h-10">
                                                    {agent.description || "No description provided."}
                                                </p>

                                                <div className="flex flex-wrap gap-2 mb-4">
                                                    {nodeCounts.start > 0 && <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20">{nodeCounts.start} Start</Badge>}
                                                    {nodeCounts.task > 0 && <Badge variant="secondary" className="bg-blue-500/10 text-blue-600 border-blue-500/20">{nodeCounts.task} Tasks</Badge>}
                                                    {nodeCounts.transfer > 0 && <Badge variant="secondary" className="bg-purple-500/10 text-purple-600 border-purple-500/20">{nodeCounts.transfer} Transfer</Badge>}
                                                    {nodeCounts.end > 0 && <Badge variant="secondary" className="bg-red-500/10 text-red-600 border-red-500/20">{nodeCounts.end} End</Badge>}
                                                </div>

                                                <div className="flex items-center justify-between pt-4 border-t border-border/50">
                                                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider font-bold">
                                                        {getTTSEngineDisplayName(agent.tts_engine)} • {agent.llm_model}
                                                    </div>
                                                    <Button variant="link" size="sm" className="h-auto p-0 text-primary font-bold text-xs">
                                                        Edit Flow →
                                                    </Button>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    );
                                })}
                            </div>

                            {hasMore && (
                                <div className="flex justify-center mt-8">
                                    <Button
                                        onClick={loadMoreAgents}
                                        disabled={loadingMore}
                                        variant="outline"
                                    >
                                        {loadingMore ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                                        {loadingMore ? "Loading..." : `Load More (${totalCount - agents.length} remaining)`}
                                    </Button>
                                </div>
                            )}
                        </>
                    ) : (
                        <Card className="border-dashed py-12 bg-card/50">
                            <CardContent className="flex flex-col items-center justify-center text-center">
                                <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mb-6 border-2 border-primary/20">
                                    <Workflow className="h-10 w-10 text-primary" />
                                </div>
                                <h3 className="text-2xl font-bold mb-2">Build your first workflow</h3>
                                <p className="text-muted-foreground max-w-md mb-8">
                                    Create sophisticated AI agents with complex conversation flows, conditional logic, and visual node structures.
                                </p>
                                <Button onClick={() => navigate('/workflows/create/basic-info')} size="lg" className="px-8 shadow-lg shadow-primary/20">
                                    <Plus className="h-5 w-5 mr-2" />
                                    Get Started
                                </Button>
                            </CardContent>
                        </Card>
                    )}
                </div>

                <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Delete Workflow</DialogTitle>
                            <DialogDescription>
                                Are you sure you want to delete <strong>{agentToDelete?.name}</strong>? This action will permanently remove the workflow and all its nodes.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="mt-6">
                            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
                            <Button variant="destructive" onClick={confirmDeleteAgent}>Delete Workflow</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </ThemeContainer>
        </DashboardLayout>
    );
};

export default MultiPromptingAgents;
