import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import ReactFlow, {
    Node,
    Edge,
    addEdge,
    useNodesState,
    useEdgesState,
    Controls,
    Background,
    Connection,
    Panel,
    NodeTypes,
    EdgeTypes,
    Handle,
    Position,
} from 'reactflow';
import 'reactflow/dist/style.css';

import DashboardLayout from "@/layout/DashboardLayout";
import { ThemeContainer } from "@/components/theme";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
    DialogFooter,
} from '@/components/ui/dialog';
import {
    Plus,
    ArrowRight,
    ArrowLeft,
    Loader2,
    AlertCircle,
    Save,
    Play,
    Square,
    Triangle,
    CheckCircle,
    Trash2,
    Workflow as WorkflowIcon
} from 'lucide-react';
import { multiPrompting as apiService } from '@/lib/api/apiService';
import type { CreateMultiPromptingAgentData, NodeCreate, MultiPromptingAgent } from '@/lib/api/multiPrompting';
import PageHeader from '@/components/ui/page-header';

// Custom Node Components
const StartNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-2 shadow-lg rounded-xl bg-emerald-500/10 border-2 border-emerald-500 min-w-[150px] group backdrop-blur-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Play className="h-4 w-4 text-emerald-600 mr-2 fill-current" />
                <div>
                    <div className="font-bold text-emerald-700 text-sm tracking-tight">{data.title}</div>
                    <div className="text-[10px] text-emerald-600 uppercase font-bold opacity-60">START</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.3 w-3 text-red-600" />
            </button>
        </div>
        <Handle type="source" position={Position.Right} id="right" style={{ background: '#10b981', width: 8, height: 8, border: '2px solid white' }} />
    </div>
);

const TaskNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-2 shadow-lg rounded-xl bg-blue-500/10 border-2 border-blue-500 min-w-[150px] group backdrop-blur-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Square className="h-4 w-4 text-blue-600 mr-2" />
                <div>
                    <div className="font-bold text-blue-700 text-sm tracking-tight">{data.title}</div>
                    <div className="text-[10px] text-blue-600 uppercase font-bold opacity-60">TASK</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3 w-3 text-red-600" />
            </button>
        </div>
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#3b82f6', width: 8, height: 8, border: '2px solid white' }} />
        <Handle type="source" position={Position.Right} id="right" style={{ background: '#3b82f6', width: 8, height: 8, border: '2px solid white' }} />
    </div>
);

const TransferNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-2 shadow-lg rounded-xl bg-purple-500/10 border-2 border-purple-500 min-w-[150px] group backdrop-blur-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Triangle className="h-4 w-4 text-purple-600 mr-2" />
                <div>
                    <div className="font-bold text-purple-700 text-sm tracking-tight">{data.title}</div>
                    <div className="text-[10px] text-purple-600 uppercase font-bold opacity-60">TRANSFER</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3 w-3 text-red-600" />
            </button>
        </div>
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#a855f7', width: 8, height: 8, border: '2px solid white' }} />
    </div>
);

const EndNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-2 shadow-lg rounded-xl bg-red-500/10 border-2 border-red-500 min-w-[150px] group backdrop-blur-sm">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <CheckCircle className="h-4 w-4 text-red-600 mr-2" />
                <div>
                    <div className="font-bold text-red-700 text-sm tracking-tight">{data.title}</div>
                    <div className="text-[10px] text-red-600 uppercase font-bold opacity-60">END</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-red-100 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3 w-3 text-red-600" />
            </button>
        </div>
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#ef4444', width: 8, height: 8, border: '2px solid white' }} />
    </div>
);

const nodeTypes: NodeTypes = {
    start: StartNode,
    task: TaskNode,
    end: EndNode,
    transfer: TransferNode,
};

// Custom Edge
const CustomEdge = ({ id, sourceX, sourceY, targetX, targetY, data, ...props }: any) => {
    const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + 80} ${sourceY} ${targetX - 80} ${targetY} ${targetX} ${targetY}`;
    return (
        <g>
            <path d={edgePath} fill="none" stroke={data?.isConditional ? "#f59e0b" : "#6366f1"} strokeWidth="3" strokeLinecap="round" className="opacity-80" />
            <path d={edgePath} fill="none" stroke={data?.isConditional ? "#f59e0b" : "#6366f1"} strokeWidth="1" strokeDasharray="5,5" className="animate-pulse" />
            <circle
                cx={(sourceX + targetX) / 2} cy={(sourceY + targetY) / 2} r="12" fill="white" stroke="#ef4444" strokeWidth="2" className="cursor-pointer shadow-md"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteEdge', { detail: id })); }}
            />
            <text x={(sourceX + targetX) / 2} y={(sourceY + targetY) / 2 + 5} textAnchor="middle" fontSize="12" fill="#ef4444" className="pointer-events-none font-bold">×</text>
            {data?.description && (
                <text x={(sourceX + targetX) / 2} y={(sourceY + targetY) / 2 - 20} textAnchor="middle" fontSize="10" fill="#64748b" className="font-medium bg-white px-2">
                    {data.description}
                </text>
            )}
        </g>
    );
};

const edgeTypes: EdgeTypes = { default: CustomEdge };

const WorkflowBuilder: React.FC = () => {
    const navigate = useNavigate();
    const { agentId } = useParams<{ agentId: string }>();
    const isEditMode = Boolean(agentId);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
    const [conditionalDialogOpen, setConditionalDialogOpen] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [conditionDescription, setConditionDescription] = useState('');
    const [basicInfo, setBasicInfo] = useState<CreateMultiPromptingAgentData | null>(null);
    const nodeIdRef = useRef(1);

    useEffect(() => {
        if (isEditMode && agentId) {
            fetchExistingAgent(agentId);
        } else {
            const saved = sessionStorage.getItem('workflowBasicInfo');
            if (saved) setBasicInfo(JSON.parse(saved));
            else navigate('/workflows/create/basic-info');
        }

        const handleDeleteEdge = (e: any) => setEdges(eds => eds.filter(edge => edge.id !== e.detail));
        const handleDeleteNode = (e: any) => deleteNode(e.detail);
        window.addEventListener('deleteEdge', handleDeleteEdge);
        window.addEventListener('deleteNode', handleDeleteNode);
        return () => {
            window.removeEventListener('deleteEdge', handleDeleteEdge);
            window.removeEventListener('deleteNode', handleDeleteNode);
        };
    }, [agentId, isEditMode]);

    const deleteNode = useCallback((id: string) => {
        setNodes(nds => nds.filter(node => node.id !== id));
        setEdges(eds => eds.filter(edge => edge.source !== id && edge.target !== id));
    }, []);

    const fetchExistingAgent = async (id: string) => {
        try {
            setLoading(true);
            const agent = await apiService.getMultiPromptingAgent(id);
            setBasicInfo(agent as any);
            if (agent.nodes) {
                setNodes(agent.nodes.map((n, i) => ({
                    id: n.id, type: n.type, position: { x: 100 + i * 200, y: 150 + i * 50 },
                    data: { ...n }
                })));
                const newEdges: Edge[] = [];
                agent.nodes.forEach(n => {
                    if (n.connected_to) {
                        n.connected_to.forEach(targetId => {
                            newEdges.push({
                                id: `${n.id}-${targetId}`, source: n.id, target: targetId, type: 'default',
                                data: { description: n.transitions?.find(t => t.to === agent.nodes.find(tn => tn.id === targetId)?.title)?.condition_description }
                            });
                        });
                    }
                });
                setEdges(newEdges);
                nodeIdRef.current = agent.nodes.length + 1;
            }
        } catch (e) { setError('Failed to load workflow data'); }
        finally { setLoading(false); }
    };

    const onConnect = useCallback((params: Connection) => {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);
        if (targetNode?.type === 'start') return;
        if (sourceNode?.type === 'end' || sourceNode?.type === 'transfer') return;
        setPendingConnection(params);
        setConditionalDialogOpen(true);
    }, [nodes]);

    const handleCreateEdge = () => {
        if (pendingConnection && conditionDescription) {
            setEdges(eds => addEdge({
                ...pendingConnection, type: 'default', animated: true,
                data: { isConditional: true, description: conditionDescription }
            }, eds));
            setConditionalDialogOpen(false);
            setConditionDescription('');
        }
    };

    const addNode = (type: string) => {
        const id = `node_${nodeIdRef.current++}`;
        const newNode: Node = {
            id, type, position: { x: 250, y: 200 },
            data: { id, type, title: `${type}_${id}`, input_prompt: '', first_dialogue: '', description: '', connected_from: [], connected_to: [], transitions: [] }
        };
        setNodes(nds => [...nds, newNode]);
    };

    const onNodeClick = (_: any, node: Node) => {
        setSelectedNode(node);
        setNodeDialogOpen(true);
    };

    const handleSaveNodeDetails = (details: any) => {
        setNodes(nds => nds.map(n => n.id === selectedNode?.id ? { ...n, data: { ...n.data, ...details } } : n));
        setNodeDialogOpen(false);
    };

    const saveWorkflow = async () => {
        if (!basicInfo) return;
        setLoading(true);
        try {
            const payload = {
                ...basicInfo,
                nodes: nodes.map(node => ({
                    ...node.data,
                    id: node.id,
                    connected_to: edges.filter(e => e.source === node.id).map(e => e.target),
                    connected_from: edges.filter(e => e.target === node.id).map(e => e.source),
                    transitions: edges.filter(e => e.source === node.id).map(e => ({
                        condition_description: e.data?.description || '',
                        to: (nodes.find(n => n.id === e.target)?.data as any).id,
                        tool_name: ''
                    }))
                }))
            };
            if (isEditMode && agentId) await apiService.updateMultiPromptingAgent(agentId, payload);
            else await apiService.createMultiPromptingAgent(payload);
            navigate('/workflows');
        } catch (e) { setError('Failed to save workflow'); }
        finally { setLoading(false); }
    };

    return (
        <DashboardLayout>
            <ThemeContainer variant="base" className="h-screen flex flex-col overflow-hidden">
                <div className="flex-none p-4 sm:px-6 border-b border-border/50 bg-background/80 backdrop-blur-sm">
                    <PageHeader
                        title={basicInfo?.name || "Workflow Builder"}
                        description="Visually design your AI agent's conversation flow"
                    >
                        <div className="flex items-center gap-3">
                            <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4 mr-2" /> Back</Button>
                            <Button onClick={saveWorkflow} disabled={loading} className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                                Save Workflow
                            </Button>
                        </div>
                    </PageHeader>
                </div>

                <div className="flex-1 relative bg-zinc-50 dark:bg-zinc-950/20">
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        nodeTypes={nodeTypes}
                        edgeTypes={edgeTypes}
                        fitView
                    >
                        <Background color="#ccc" gap={20} />
                        <Controls />

                        <Panel position="top-left" className="bg-white/80 dark:bg-zinc-900/80 p-2 rounded-xl border border-border/50 backdrop-blur-md shadow-xl mt-4 ml-4">
                            <div className="flex flex-col gap-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase px-2 mb-1 tracking-wider">Add Components</p>
                                <Button variant="outline" size="sm" onClick={() => addNode('start')} className="justify-start gap-2 border-emerald-500/20 hover:bg-emerald-50"><Play className="h-4 w-4 text-emerald-500" /> Start Node</Button>
                                <Button variant="outline" size="sm" onClick={() => addNode('task')} className="justify-start gap-2 border-blue-500/20 hover:bg-blue-50"><Square className="h-4 w-4 text-blue-500" /> Task Node</Button>
                                <Button variant="outline" size="sm" onClick={() => addNode('transfer')} className="justify-start gap-2 border-purple-500/20 hover:bg-purple-50"><Triangle className="h-4 w-4 text-purple-500" /> Transfer</Button>
                                <Button variant="outline" size="sm" onClick={() => addNode('end')} className="justify-start gap-2 border-red-500/20 hover:bg-red-50"><CheckCircle className="h-4 w-4 text-red-500" /> End Node</Button>
                            </div>
                        </Panel>
                    </ReactFlow>
                </div>

                {/* Node Details Dialog */}
                <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader><DialogTitle>Configure Node: {selectedNode?.data.title}</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <Label>Title</Label>
                                <Input value={selectedNode?.data.title} onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, title: e.target.value } }) : null)} />
                            </div>
                            <div className="space-y-2">
                                <Label>Input Prompt/Instructions</Label>
                                <Textarea rows={4} value={selectedNode?.data.input_prompt} onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, input_prompt: e.target.value } }) : null)} placeholder="Instructions for the agent when it enters this node..." />
                            </div>
                            <div className="space-y-2">
                                <Label>First Dialogue (Greeting)</Label>
                                <Input value={selectedNode?.data.first_dialogue} onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, first_dialogue: e.target.value } }) : null)} placeholder="What the agent says first in this node..." />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setNodeDialogOpen(false)}>Cancel</Button>
                            <Button onClick={() => handleSaveNodeDetails(selectedNode?.data)}>Save Node</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Connection Dialog */}
                <Dialog open={conditionalDialogOpen} onOpenChange={setConditionalDialogOpen}>
                    <DialogContent>
                        <DialogHeader><DialogTitle>Set Connection Condition</DialogTitle></DialogHeader>
                        <div className="space-y-4 py-4">
                            <p className="text-sm text-muted-foreground">Describe the condition under which the agent should transition to the next node.</p>
                            <Textarea value={conditionDescription} onChange={e => setConditionDescription(e.target.value)} placeholder="e.g., When the user expresses interest in booking an appointment..." rows={3} />
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setConditionalDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateEdge} disabled={!conditionDescription}>Create Connection</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </ThemeContainer>
        </DashboardLayout>
    );
};

export default WorkflowBuilder;
