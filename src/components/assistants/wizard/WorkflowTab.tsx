import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import {
    Plus,
    Play,
    Square,
    Triangle,
    CheckCircle,
    Trash2,
    Settings,
    Info
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';

// Custom Node Components
const StartNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-3 shadow-xl rounded-2xl bg-emerald-500/10 border-2 border-emerald-500 min-w-[180px] group backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                    <Play className="h-4 w-4 fill-current" />
                </div>
                <div>
                    <div className="font-bold text-emerald-700 dark:text-emerald-300 text-sm tracking-tight leading-none mb-1">{data.title}</div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-extrabold opacity-60 tracking-wider">START NODE</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
        </div>
        <Handle type="source" position={Position.Right} id="right" style={{ background: '#10b981', width: 10, height: 10, border: '2px solid white' }} />
    </div>
);

const TaskNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-3 shadow-xl rounded-2xl bg-indigo-500/10 border-2 border-indigo-500 min-w-[180px] group backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                    <Square className="h-4 w-4" />
                </div>
                <div>
                    <div className="font-bold text-indigo-700 dark:text-indigo-300 text-sm tracking-tight leading-none mb-1">{data.title}</div>
                    <div className="text-[10px] text-indigo-600 dark:text-indigo-400 uppercase font-extrabold opacity-60 tracking-wider">AI TASK</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
        </div>
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#6366f1', width: 10, height: 10, border: '2px solid white' }} />
        <Handle type="source" position={Position.Right} id="right" style={{ background: '#6366f1', width: 10, height: 10, border: '2px solid white' }} />
    </div>
);

const TransferNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-3 shadow-xl rounded-2xl bg-purple-500/10 border-2 border-purple-500 min-w-[180px] group backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-purple-500 flex items-center justify-center text-white shadow-lg shadow-purple-500/20">
                    <Triangle className="h-4 w-4" />
                </div>
                <div>
                    <div className="font-bold text-purple-700 dark:text-purple-300 text-sm tracking-tight leading-none mb-1">{data.title}</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-400 uppercase font-extrabold opacity-60 tracking-wider">TRANSFER</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
        </div>
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#a855f7', width: 10, height: 10, border: '2px solid white' }} />
    </div>
);

const EndNode = ({ data }: { data: any }) => (
    <div className="relative px-4 py-3 shadow-xl rounded-2xl bg-rose-500/10 border-2 border-rose-500 min-w-[180px] group backdrop-blur-md">
        <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-rose-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                    <CheckCircle className="h-4 w-4" />
                </div>
                <div>
                    <div className="font-bold text-rose-700 dark:text-rose-300 text-sm tracking-tight leading-none mb-1">{data.title}</div>
                    <div className="text-[10px] text-rose-600 dark:text-rose-400 uppercase font-extrabold opacity-60 tracking-wider">END CALL</div>
                </div>
            </div>
            <button
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full"
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteNode', { detail: data.id })); }}
            >
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
            </button>
        </div>
        <Handle type="target" position={Position.Left} id="left" style={{ background: '#f43f5e', width: 10, height: 10, border: '2px solid white' }} />
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
    const edgePath = `M ${sourceX} ${sourceY} C ${sourceX + 100} ${sourceY} ${targetX - 100} ${targetY} ${targetX} ${targetY}`;
    return (
        <g>
            <path
                d={edgePath}
                fill="none"
                stroke={data?.isConditional ? "#f59e0b" : "#6366f1"}
                strokeWidth="4"
                strokeLinecap="round"
                className="opacity-20 hover:opacity-40 transition-opacity cursor-pointer"
            />
            <path
                d={edgePath}
                fill="none"
                stroke={data?.isConditional ? "#f59e0b" : "#6366f1"}
                strokeWidth="2"
                strokeDasharray={data?.isConditional ? "5,5" : "none"}
                className={data?.isConditional ? "animate-pulse" : ""}
            />
            <g
                transform={`translate(${(sourceX + targetX) / 2 - 10}, ${(sourceY + targetY) / 2 - 10})`}
                onClick={(e) => { e.stopPropagation(); window.dispatchEvent(new CustomEvent('deleteEdge', { detail: id })); }}
                className="cursor-pointer group"
            >
                <circle r="10" cx="10" cy="10" fill="white" className="shadow-sm border border-zinc-200" />
                <text x="10" y="14" textAnchor="middle" fontSize="12" fill="#ef4444" className="font-bold group-hover:scale-110 transition-transform">×</text>
            </g>
            {data?.description && (
                <text
                    x={(sourceX + targetX) / 2}
                    y={(sourceY + targetY) / 2 - 20}
                    textAnchor="middle"
                    fontSize="10"
                    className="font-bold fill-amber-600 dark:fill-amber-400"
                >
                    {data.description.length > 30 ? data.description.substring(0, 27) + "..." : data.description}
                </text>
            )}
        </g>
    );
};

const edgeTypes: EdgeTypes = { default: CustomEdge };

interface WorkflowTabProps {
    nodes?: any[];
    edges?: any[];
    onChange: (data: { nodes: any[], edges: any[] }) => void;
}

export const WorkflowTab: React.FC<WorkflowTabProps> = ({ nodes: initialNodes = [], edges: initialEdges = [], onChange }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [selectedNode, setSelectedNode] = useState<Node | null>(null);
    const [nodeDialogOpen, setNodeDialogOpen] = useState(false);
    const [conditionalDialogOpen, setConditionalDialogOpen] = useState(false);
    const [pendingConnection, setPendingConnection] = useState<Connection | null>(null);
    const [conditionDescription, setConditionDescription] = useState('');
    const nodeIdRef = useRef(initialNodes.length + 1);

    // Initial load
    useEffect(() => {
        if (initialNodes.length > 0) {
            setNodes(initialNodes);
            setEdges(initialEdges);
            nodeIdRef.current = Math.max(...initialNodes.map(n => parseInt(n.id.replace('node_', '') || '0'))) + 1;
        } else if (nodes.length === 0) {
            // Add a default start node
            const startNode = {
                id: 'node_1',
                type: 'start',
                position: { x: 100, y: 150 },
                data: { id: 'node_1', type: 'start', title: 'Getting Started', input_prompt: 'Greet the user and ask how you can help.', first_dialogue: 'Hello! How can I help you today?' }
            };
            setNodes([startNode]);
            nodeIdRef.current = 2;
        }
    }, []);

    // Sync up
    useEffect(() => {
        onChange({ nodes, edges });
    }, [nodes, edges]);

    useEffect(() => {
        const handleDeleteEdge = (e: any) => setEdges(eds => eds.filter(edge => edge.id !== e.detail));
        const handleDeleteNode = (e: any) => {
            setNodes(nds => nds.filter(node => node.id !== e.detail));
            setEdges(eds => eds.filter(edge => edge.source !== e.detail && edge.target !== e.detail));
        };
        window.addEventListener('deleteEdge', handleDeleteEdge);
        window.addEventListener('deleteNode', handleDeleteNode);
        return () => {
            window.removeEventListener('deleteEdge', handleDeleteEdge);
            window.removeEventListener('deleteNode', handleDeleteNode);
        };
    }, [setNodes, setEdges]);

    const onConnect = useCallback((params: Connection) => {
        const sourceNode = nodes.find(n => n.id === params.source);
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
            id, type, position: { x: Math.random() * 200 + 100, y: Math.random() * 200 + 100 },
            data: { id, type, title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`, input_prompt: '', first_dialogue: '' }
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

    return (
        <div className="h-[600px] w-full relative group/flow rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-[#f8fafc] dark:bg-zinc-950/20">
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
                className="bg-transparent"
            >
                <Background color="#94a3b8" gap={24} size={1} />
                <Controls className="!bg-white dark:!bg-zinc-900 !border-border/40 !rounded-xl !shadow-xl" />

                <Panel position="top-left" className="m-4">
                    <Card className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border-border/40 shadow-xl rounded-2xl overflow-hidden min-w-[160px]">
                        <CardContent className="p-3 flex flex-col gap-2">
                            <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[2px] mb-1 px-2">Components</p>
                            <Button variant="outline" size="sm" onClick={() => addNode('task')} className="justify-start gap-2.5 h-10 px-3 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 border-indigo-500/10 hover:border-indigo-500/30">
                                <Square className="h-4 w-4 text-indigo-500" />
                                <span className="text-xs font-bold">Standard Task</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addNode('transfer')} className="justify-start gap-2.5 h-10 px-3 hover:bg-purple-50 dark:hover:bg-purple-900/20 border-purple-500/10 hover:border-purple-500/30">
                                <Triangle className="h-4 w-4 text-purple-500" />
                                <span className="text-xs font-bold">Transfer Call</span>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => addNode('end')} className="justify-start gap-2.5 h-10 px-3 hover:bg-rose-50 dark:hover:bg-rose-900/20 border-rose-500/10 hover:border-rose-500/30">
                                <CheckCircle className="h-4 w-4 text-rose-500" />
                                <span className="text-xs font-bold">End Call</span>
                            </Button>
                        </CardContent>
                    </Card>
                </Panel>

                <Panel position="bottom-right" className="m-4">
                    <div className="bg-indigo-600/10 border border-indigo-600/20 text-indigo-600 dark:text-indigo-400 px-3 py-2 rounded-xl flex items-center gap-2 backdrop-blur-sm animate-pulse">
                        <Info className="h-4 w-4" />
                        <span className="text-[10px] font-bold uppercase tracking-wider">Drag nodes to connect</span>
                    </div>
                </Panel>
            </ReactFlow>

            {/* Node Details Dialog */}
            <Dialog open={nodeDialogOpen} onOpenChange={setNodeDialogOpen}>
                <DialogContent className="max-w-2xl bg-white dark:bg-zinc-900 border-border/40 rounded-[2rem] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                            <Settings className="h-6 w-6 text-indigo-500" />
                            Configure {selectedNode?.type} Node
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Node Title</Label>
                            <Input
                                value={selectedNode?.data.title || ''}
                                onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, title: e.target.value } }) : null)}
                                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 rounded-xl"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Instructions (Input Prompt)</Label>
                            <Textarea
                                rows={4}
                                value={selectedNode?.data.input_prompt || ''}
                                onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, input_prompt: e.target.value } }) : null)}
                                placeholder="Specific instructions for the AI in this state..."
                                className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 rounded-xl resize-none"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-bold text-zinc-500 uppercase tracking-wider">Dialogue (Greeting Message)</Label>
                            <Input
                                value={selectedNode?.data.first_dialogue || ''}
                                onChange={e => setSelectedNode(n => n ? ({ ...n, data: { ...n.data, first_dialogue: e.target.value } }) : null)}
                                placeholder="What the agent says upon entering this node..."
                                className="h-12 bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 rounded-xl"
                            />
                        </div>
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="ghost" onClick={() => setNodeDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold">Cancel</Button>
                        <Button onClick={() => handleSaveNodeDetails(selectedNode?.data)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-indigo-600/20">Apply Changes</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Connection Dialog */}
            <Dialog open={conditionalDialogOpen} onOpenChange={setConditionalDialogOpen}>
                <DialogContent className="bg-white dark:bg-zinc-900 border-border/40 rounded-[2rem] p-8">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-black tracking-tight">Set Transition Logic</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <p className="text-sm text-zinc-500 leading-relaxed font-medium">When should the AI move to the next step? Describe the conversation trigger naturally.</p>
                        <Textarea
                            value={conditionDescription}
                            onChange={e => setConditionDescription(e.target.value)}
                            placeholder="e.g., If the user asks about pricing, If the user confirms their email..."
                            rows={3}
                            className="bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700/50 rounded-xl resize-none"
                        />
                    </div>
                    <DialogFooter className="gap-3">
                        <Button variant="ghost" onClick={() => setConditionalDialogOpen(false)} className="rounded-xl h-12 px-6 font-bold">Cancel</Button>
                        <Button onClick={handleCreateEdge} disabled={!conditionDescription} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 px-8 font-bold shadow-lg shadow-indigo-600/20">Create Transition</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
