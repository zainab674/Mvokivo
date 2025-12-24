import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
    Plus,
    AlertCircle,
    Trash2,
    Loader2,
    Search,
    Workflow,
    Edit2
} from 'lucide-react';
import { multiPrompting as apiService } from '@/lib/api/apiService';
import type { MultiPromptingAgent } from '@/lib/api/multiPrompting';
import { ThemedDialog, ThemedDialogHeader, ThemedDialogContent } from "@/components/ui/themed-dialog";

interface WorkflowsTabProps {
    tabChangeTrigger?: number;
}

export function WorkflowsTab({ tabChangeTrigger = 0 }: WorkflowsTabProps) {
    const navigate = useNavigate();
    const [agents, setAgents] = useState<MultiPromptingAgent[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchQuery] = useState('');
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [agentToDelete, setAgentToDelete] = useState<MultiPromptingAgent | null>(null);

    const fetchAgents = async () => {
        try {
            setLoading(true);
            setError(null);
            const data = await apiService.getMultiPromptingAgents(1, 100, searchTerm);
            setAgents(data.agents);
        } catch (err) {
            console.error('Error fetching workflows:', err);
            setError('Failed to fetch workflows');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAgents();
    }, [tabChangeTrigger, searchTerm]);

    const handleDelete = async () => {
        if (!agentToDelete) return;
        try {
            const id = agentToDelete.id || agentToDelete._id;
            if (id) {
                await apiService.deleteMultiPromptingAgent(id);
                setAgents(prev => prev.filter(a => (a.id || a._id) !== id));
            }
            setIsDeleteOpen(false);
            setAgentToDelete(null);
        } catch (err) {
            setError('Failed to delete workflow');
        }
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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-semibold text-white mb-1">
                        Workflows
                    </h2>
                    <p className="text-sm text-zinc-400">
                        Design complex AI agent conversation flows using visual nodes
                    </p>
                </div>
                <Button
                    variant="default"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white gap-2"
                    onClick={() => navigate('/workflows/create/basic-info')}
                >
                    <Plus className="h-4 w-4" />
                    Add Workflow
                </Button>
            </div>

            {/* Search Bar */}
            <div className="relative max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-zinc-400" />
                <Input
                    placeholder="Search workflows..."
                    value={searchTerm}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 h-9 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-indigo-500/50"
                />
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="h-48 bg-zinc-800/50 rounded-xl animate-pulse" />
                    ))}
                </div>
            ) : agents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {agents.map((agent) => {
                        const counts = getNodeTypeCounts(agent.nodes);
                        const id = agent.id || agent._id;
                        return (
                            <Card key={id} className="bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/50 transition-all group overflow-hidden">
                                <CardHeader className="pb-2">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 bg-indigo-500/20 rounded-lg flex items-center justify-center border border-indigo-500/30 text-indigo-400">
                                                <Workflow className="h-5 w-5" />
                                            </div>
                                            <CardTitle className="text-white text-lg font-bold truncate max-w-[150px]">{agent.name}</CardTitle>
                                        </div>
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => navigate(`/workflows/edit/${id}/flow`)} className="h-8 w-8 text-zinc-400 hover:text-white hover:bg-zinc-700/50">
                                                <Edit2 className="h-4 w-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => { setAgentToDelete(agent); setIsDeleteOpen(true); }} className="h-8 w-8 text-zinc-400 hover:text-red-400 hover:bg-red-400/10">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-zinc-400 line-clamp-2 h-10 mb-4">{agent.description || "No description provided."}</p>
                                    <div className="flex flex-wrap gap-1.5 mb-4">
                                        {counts.start > 0 && <Badge variant="outline" className="text-[10px] bg-green-500/10 text-green-400 border-green-500/20">{counts.start} Start</Badge>}
                                        {counts.task > 0 && <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-400 border-blue-500/20">{counts.task} Tasks</Badge>}
                                        {counts.transfer > 0 && <Badge variant="outline" className="text-[10px] bg-purple-500/10 text-purple-400 border-purple-500/20">{counts.transfer} Transfer</Badge>}
                                        {counts.end > 0 && <Badge variant="outline" className="text-[10px] bg-red-500/10 text-red-400 border-red-500/20">{counts.end} End</Badge>}
                                    </div>
                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{agent.llm_model}</span>
                                        <Button variant="link" size="sm" onClick={() => navigate(`/workflows/edit/${id}/flow`)} className="p-0 text-indigo-400 hover:text-indigo-300 font-bold text-xs h-auto">
                                            View Flow →
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <div className="p-12 text-center bg-zinc-800/30 rounded-lg border border-zinc-700/50 border-dashed">
                    <div className="w-16 h-16 mx-auto mb-4 bg-zinc-800/50 rounded-2xl flex items-center justify-center border border-zinc-700/50 text-zinc-500 text-muted-foreground">
                        <Workflow className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-semibold text-white mb-2">No workflows found</h3>
                    <p className="text-zinc-400 mb-6 max-w-xs mx-auto text-sm">Create sophisticated AI agents with complex conversation flows using our visual builder.</p>
                    <Button
                        variant="default"
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        onClick={() => navigate('/workflows/create/basic-info')}
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Workflow
                    </Button>
                </div>
            )}

            {/* Delete Dialog */}
            <ThemedDialog open={isDeleteOpen} onOpenChange={setIsDeleteOpen}>
                <ThemedDialogContent>
                    <ThemedDialogHeader
                        title="Delete Workflow"
                        description={`Are you sure you want to delete "${agentToDelete?.name}"? This will permanently remove the workflow and all its nodes.`}
                    />
                    <div className="flex gap-3 mt-6">
                        <Button variant="outline" className="flex-1" onClick={() => setIsDeleteOpen(false)}>Cancel</Button>
                        <Button variant="destructive" className="flex-1" onClick={handleDelete}>Delete Workflow</Button>
                    </div>
                </ThemedDialogContent>
            </ThemedDialog>
        </div>
    );
}
