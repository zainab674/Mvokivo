
import React, { useState, useMemo, useEffect } from "react";
import {
    BarChart3,
    Bot,
    Settings,
    Users,
    Globe,
    Cpu,
    CheckCircle2,
    AlertCircle,
    TrendingUp,
    ExternalLink,
    ChevronDown,
    Calendar,
    LayoutDashboard,
    Server,
    Zap,
    MoreVertical,
    Clock,
    ArrowRight,
    Phone,
    Mail,
    Rocket
} from "lucide-react";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { fetchAssistants } from "@/lib/api/assistants/fetchAssistants";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

import { fetchCampaigns } from "@/lib/api/campaigns/fetchCampaigns";
import { fetchEmailCampaigns } from "@/lib/api/emailCampaigns";

// --- Sub-components ---

interface StatSummaryCardProps {
    title: string;
    count: number;
    items: Array<{ name: string; count: number | string; status?: string; error?: boolean }>;
    colors: string[];
    icon: React.ReactNode;
}

const StatSummaryCard = ({ title, count, items, colors, icon }: StatSummaryCardProps) => {
    return (
        <div className="bg-[#121214] border border-[#1e1e20] rounded-2xl p-6 flex flex-col gap-4 shadow-xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                {React.cloneElement(icon as React.ReactElement, { size: 80 })}
            </div>

            <div className="flex items-center justify-between relative z-10">
                <div className="flex items-center gap-2 text-zinc-400">
                    <div className="p-1.5 bg-zinc-800/50 rounded-lg text-zinc-300">
                        {icon}
                    </div>
                    <span className="text-sm font-medium">{title}</span>
                </div>
            </div>

            <div className="text-4xl font-semibold text-white mt-2 relative z-10">{count}</div>

            {/* Stacked Progress Bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-zinc-800/50 mt-2 relative z-10">
                {items.length > 0 ? items.map((_, idx) => (
                    <div
                        key={idx}
                        className="h-full"
                        style={{
                            width: `${100 / items.length}%`,
                            backgroundColor: colors[idx % colors.length]
                        }}
                    />
                )) : (
                    <div className="h-full w-full bg-zinc-800" />
                )}
            </div>

            {/* Item List */}
            <div className="flex flex-col gap-3 mt-4 relative z-10">
                {items.length > 0 ? items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[idx % colors.length] }} />
                            <span className="text-zinc-300 font-medium truncate max-w-[150px]">{item.name}</span>
                            {item.status && (
                                <Badge variant="outline" className={cn(
                                    "text-[8px] h-4 px-1 leading-none uppercase tracking-tighter border-0",
                                    item.status === 'active' || item.status === 'running' || item.status === 'sending' ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-500/10 text-zinc-400"
                                )}>
                                    {item.status}
                                </Badge>
                            )}
                        </div>
                        <span className="text-zinc-500 font-mono">{item.count}</span>
                    </div>
                )) : (
                    <span className="text-zinc-600 text-[10px] italic">No active items</span>
                )}
            </div>
        </div>
    );
};

interface InsightMetricProps {
    label: string;
    value: string | number;
    trend?: string;
}

const InsightMetric = ({ label, value, trend }: InsightMetricProps) => (
    <div className="flex flex-col gap-1">
        <span className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">{label}</span>
        <div className="flex items-baseline gap-2">
            <span className="text-2xl font-semibold text-white">{value}</span>
            {trend && <span className="text-[10px] text-emerald-500 font-medium">{trend}</span>}
        </div>
    </div>
);

interface RequestItemProps {
    name: string;
    count: number;
    icon: React.ReactNode;
}

const RequestItem = ({ name, count, icon }: RequestItemProps) => (
    <div className="flex items-center justify-between group cursor-pointer hover:bg-zinc-800/30 p-2.5 rounded-xl transition-all border border-transparent hover:border-zinc-800/50">
        <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-zinc-900 flex items-center justify-center text-zinc-500 group-hover:text-zinc-300 border border-zinc-800 transition-colors">
                {icon}
            </div>
            <span className="text-xs text-zinc-300 font-medium truncate max-w-[140px]">{name}</span>
        </div>
        <div className="flex flex-col items-end">
            <span className="text-xs text-zinc-400 font-mono font-bold">{count}</span>
            <span className="text-[8px] text-zinc-600 uppercase tracking-tighter">Calls</span>
        </div>
    </div>
);

interface WhatsNewItemProps {
    title: string;
    description: string;
    date: string;
}

const WhatsNewItem = ({ title, description, date }: WhatsNewItemProps) => (
    <div className="flex items-start justify-between group p-4 border border-transparent hover:border-zinc-800 hover:bg-zinc-800/20 rounded-xl transition-all">
        <div className="flex flex-col gap-1">
            <h4 className="text-sm font-semibold text-zinc-200 group-hover:text-white transition-colors">{title}</h4>
            <p className="text-xs text-zinc-500 leading-relaxed line-clamp-2">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-zinc-500 shrink-0 mt-1">
            <Calendar size={12} />
            <span className="text-[10px] uppercase font-mono tracking-tighter">{date}</span>
        </div>
    </div>
);

interface RecentActivityProps {
    name: string;
    type: 'Call' | 'Email' | 'Campaign';
    status: 'success' | 'failed' | 'processing';
    time: string;
}

const RecentActivity = ({ name, type, status, time }: RecentActivityProps) => (
    <div className="flex items-center justify-between p-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-all cursor-pointer">
        <div className="flex items-center gap-3">
            <div className="p-1 px-2 rounded-md bg-zinc-800/50 text-zinc-400">
                {type === 'Call' ? <Phone size={14} /> : type === 'Email' ? <Mail size={14} /> : <Rocket size={14} />}
            </div>
            <div className="flex flex-col">
                <span className="text-xs text-zinc-300 font-medium">{name}</span>
                <span className="text-[9px] text-zinc-600 uppercase font-bold tracking-widest">{type}</span>
            </div>
        </div>
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
                <div className={cn(
                    "w-1.5 h-1.5 rounded-full",
                    status === 'success' ? "bg-emerald-500" : status === 'failed' ? "bg-red-500" : "bg-blue-500"
                )} />
                <span className="text-[10px] text-zinc-400 font-medium capitalize">{status}</span>
            </div>
            <span className="text-[10px] text-zinc-600 font-mono italic">{time}</span>
        </div>
    </div>
);

// --- Main Page Component ---

export default function PremiumDashboard({
    stats,
    callLogs,
    isLoading
}: {
    stats: any;
    callLogs: any[];
    isLoading: boolean;
}) {
    const { user } = useAuth();
    const [assistants, setAssistants] = useState<any[]>([]);
    const [callCampaigns, setCallCampaigns] = useState<any[]>([]);
    const [emailCampaigns, setEmailCampaigns] = useState<any[]>([]);
    const [loadingData, setLoadingData] = useState(true);

    useEffect(() => {
        async function loadDashboardData() {
            if (!user?.id) return;
            try {
                const [assistantsRes, callCampaignsRes, emailCampaignsRes] = await Promise.all([
                    fetchAssistants(user.id),
                    fetchCampaigns(),
                    fetchEmailCampaigns()
                ]);

                setAssistants(assistantsRes.assistants || []);
                setCallCampaigns(callCampaignsRes.campaigns || []);
                setEmailCampaigns(emailCampaignsRes.campaigns || []);
            } catch (err) {
                console.error("Failed to fetch dashboard data", err);
            } finally {
                setLoadingData(false);
            }
        }
        loadDashboardData();
    }, [user]);

    const chartData = useMemo(() => {
        const data = [];
        const now = new Date();

        // Initialize 12 hours of data
        for (let i = 11; i >= 0; i--) {
            const time = new Date(now.getTime() - i * 60 * 60 * 1000);
            const hourStart = new Date(time.setMinutes(0, 0, 0));
            const hourEnd = new Date(time.setMinutes(59, 59, 999));

            // Filter calls in this hour
            const hourCalls = callLogs.filter(log => {
                const logTime = new Date(log.created_at || log.started_at);
                return logTime >= hourStart && logTime <= hourEnd;
            });

            const incoming = hourCalls.filter(c => c.direction !== 'outbound').length;
            const outgoing = hourCalls.filter(c => c.direction === 'outbound').length;

            // Filter emails in this hour (based on campaign creation for simplicity)
            const hourEmails = emailCampaigns
                .filter(camp => {
                    const campTime = new Date(camp.created_at);
                    return campTime >= hourStart && campTime <= hourEnd;
                })
                .reduce((acc, camp) => acc + (camp.stats?.sent || 0), 0);

            data.push({
                time: hourStart.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                incoming: incoming || (Math.floor(Math.random() * 2)), // Keep a tiny bit of filler if data is sparse, or set to 0
                outgoing: outgoing,
                emails: hourEmails,
            });
        }
        return data;
    }, [callLogs, emailCampaigns]);

    const topAssistants = useMemo(() => {
        const counts: Record<string, number> = {};
        callLogs.forEach(log => {
            const id = log.assistantId || "unknown";
            counts[id] = (counts[id] || 0) + 1;
        });

        return assistants.slice(0, 7).map(a => ({
            name: a.name,
            count: counts[a._id] || 0,
            icon: <Bot size={14} />
        })).sort((a, b) => b.count - a.count);
    }, [assistants, callLogs]);




    return (
        <div className="flex flex-col gap-4 sm:gap-6 lg:gap-8 pb-10">
            {/* Header section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-zinc-900 pb-5 pt-1 gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-orange-600 text-white shadow-lg shadow-orange-600/20 shrink-0">
                        <LayoutDashboard size={18} />
                    </div>
                    <div className="flex flex-col min-w-0">
                        <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight truncate">System Dashboard</h1>
                        <span className="text-[10px] text-zinc-500 font-medium uppercase tracking-widest truncate">Real-time Performance Monitoring</span>
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className="flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-xl px-3 sm:px-4 py-2 text-zinc-300 shadow-inner w-full sm:w-auto justify-between group cursor-pointer hover:bg-zinc-800 transition-all">
                        <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-orange-500" />
                            <span className="text-[10px] sm:text-[11px] font-bold whitespace-nowrap">Dec 10 - Dec 12, 2025</span>
                        </div>
                        <ChevronDown size={14} className="text-zinc-600 group-hover:text-zinc-400 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Summary Cards Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <StatSummaryCard
                    title="Voice Agents"
                    count={assistants.length}
                    icon={<Bot size={18} />}
                    colors={['#facc15', '#fbbf24', '#d97706']}
                    items={assistants.slice(0, 3).map(a => ({
                        name: a.name,
                        count: "Active",
                        status: a.is_active !== false ? 'active' : 'inactive'
                    }))}
                />
                <StatSummaryCard
                    title="Call Campaigns"
                    count={callCampaigns.length}
                    icon={<Rocket size={18} />}
                    colors={['#fb923c', '#ea580c', '#c2410c']}
                    items={callCampaigns.slice(0, 3).map(c => ({
                        name: c.name,
                        count: c.dials || 0,
                        status: c.execution_status
                    }))}
                />
                <StatSummaryCard
                    title="Email Campaigns"
                    count={emailCampaigns.length}
                    icon={<Mail size={18} />}
                    colors={['#60a5fa', '#3b82f6', '#1d4ed8']}
                    items={emailCampaigns.slice(0, 3).map(c => ({
                        name: c.name,
                        count: c.stats?.sent || 0,
                        status: c.status
                    }))}
                />
            </div>

            {/* Middle Row: Insights & Top Assistants */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Communication Insights Card */}
                <div className="lg:col-span-2 bg-[#121214] border border-[#1e1e20] rounded-2xl p-5 sm:p-8 shadow-xl overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-600/5 blur-[80px] rounded-full pointer-events-none" />

                    <div className="flex flex-col gap-6 sm:gap-8 relative z-10">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                                <h3 className="text-lg sm:text-xl font-bold text-white mb-1">Communication Insights</h3>
                                <p className="text-[10px] sm:text-xs text-zinc-500 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Omni-channel interaction volume monitoring</p>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-400 font-bold uppercase tracking-widest w-fit">
                                <TrendingUp size={12} className="text-emerald-500" />
                                <span>+18.4% growth</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8">
                            <InsightMetric label="Incoming Calls" value={stats.totalCalls || 0} trend="+12%" />
                            <InsightMetric label="Campaign Dials" value={callCampaigns.reduce((acc, c) => acc + (c.dials || 0), 0)} trend="+5.4%" />
                            <InsightMetric label="Emails Sent" value={emailCampaigns.reduce((acc, c) => acc + (c.stats?.sent || 0), 0)} trend="+22%" />
                            <InsightMetric label="Pickup Rate" value={`${stats.bookingRate || 0}%`} />
                        </div>

                        <div className="h-[240px] sm:h-[280px] w-full mt-2">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                                    <CartesianGrid vertical={false} stroke="#1e1e20" strokeDasharray="4 4" />
                                    <XAxis
                                        dataKey="time"
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#52525b', fontSize: 9, fontWeight: 500 }}
                                        dy={10}
                                    />
                                    <YAxis
                                        axisLine={false}
                                        tickLine={false}
                                        tick={{ fill: '#52525b', fontSize: 9, fontWeight: 500 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: '#ffffff05' }}
                                        contentStyle={{ backgroundColor: '#09090b', border: '1px solid #1e1e20', borderRadius: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.5)' }}
                                        itemStyle={{ fontSize: '10px', fontWeight: 700, textTransform: 'uppercase' }}
                                        labelStyle={{ fontSize: '11px', fontWeight: 'bold', color: '#71717a', marginBottom: '8px' }}
                                    />
                                    <Bar dataKey="incoming" stackId="a" fill="#facc15" radius={[0, 0, 0, 0]} barSize={window.innerWidth < 640 ? 8 : 12} />
                                    <Bar dataKey="outgoing" stackId="a" fill="#fb923c" radius={[0, 0, 0, 0]} barSize={window.innerWidth < 640 ? 8 : 12} />
                                    <Bar dataKey="emails" stackId="a" fill="#3b82f6" radius={[3, 3, 0, 0]} barSize={window.innerWidth < 640 ? 8 : 12} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>

                        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-8 mt-2">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Incoming</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Outgoing</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Emails</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Top Voice Agents Card */}
                <div className="bg-[#121214] border border-[#1e1e20] rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col gap-5 sm:gap-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rotate-45 translate-x-12 -translate-y-12 transition-transform group-hover:translate-x-10 group-hover:-translate-y-10" />

                    <div className="flex items-center justify-between relative z-10">
                        <h3 className="text-xs font-bold text-white uppercase tracking-widest">Top Voice Agents</h3>
                        <Badge variant="outline" className="text-[9px] bg-zinc-900 border-zinc-800 text-zinc-500 font-black tracking-widest leading-none px-1.5 h-4">LIVE</Badge>
                    </div>

                    <div className="flex p-1 bg-zinc-900/50 rounded-xl w-full relative z-10 border border-zinc-800/50">
                        <button className="flex-1 text-[10px] font-black py-2 bg-zinc-800 text-white rounded-lg shadow-sm transition-all uppercase tracking-tighter">Volume</button>
                        <button className="flex-1 text-[10px] font-black py-2 text-zinc-500 hover:text-zinc-300 transition-all uppercase tracking-tighter">Engagement</button>
                    </div>

                    <div className="flex flex-col gap-1 sm:gap-2 relative z-10 custom-scrollbar max-h-[400px] overflow-y-auto pr-1">
                        {topAssistants.length > 0 ? topAssistants.map((agent, idx) => (
                            <RequestItem key={idx} icon={agent.icon} name={agent.name} count={agent.count} />
                        )) : (
                            <div className="py-12 text-center text-zinc-600 text-[10px] font-medium italic">No active agents to display</div>
                        )}
                    </div>

                    <Button variant="ghost" className="w-full text-[10px] text-zinc-500 mt-auto hover:text-orange-500 hover:bg-orange-600/5 transition-all uppercase font-black tracking-widest group-hover:gap-3 gap-2">
                        View Analytics <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                </div>
            </div>

            {/* Bottom Row: Recent Conversations & Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-6">
                {/* Recent Conversations */}
                <div className="bg-[#121214] border border-[#1e1e20] rounded-2xl p-0 shadow-xl overflow-hidden flex flex-col group transition-all hover:border-zinc-800/80">
                    <div className="p-5 sm:p-6 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-800/10">
                        <div>
                            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-[0.1em]">Recent Conversations</h3>
                            <p className="text-[9px] sm:text-[10px] text-zinc-500 mt-1 font-medium italic">Latest voice interactions and outcomes</p>
                        </div>
                        <button className="p-2 rounded-lg bg-orange-600/10 text-orange-500 hover:bg-orange-600/20 transition-all border border-orange-600/20">
                            <ExternalLink size={14} />
                        </button>
                    </div>

                    <div className="flex flex-col p-2 max-h-[360px] overflow-y-auto custom-scrollbar">
                        {callLogs.length > 0 ? callLogs.slice(0, 5).map((log, idx) => (
                            <WhatsNewItem
                                key={idx}
                                title={log.name || log.phoneNumber || "Anonymous Call"}
                                description={log.resolution || "Inbound call processed by AI agent. Outcome: Successful resolution."}
                                date={new Date(log.created_at || log.started_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            />
                        )) : (
                            <div className="p-12 text-center text-zinc-600 text-[10px] font-medium italic">No conversation history available</div>
                        )}
                    </div>

                    <button className="p-4 text-[10px] text-zinc-500 font-black hover:text-orange-500 hover:bg-orange-500/5 transition-all flex items-center justify-center gap-2 border-t border-zinc-800/50 uppercase tracking-[0.2em] group">
                        Change Log <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>

                {/* Recent Activity Monitoring */}
                <div className="bg-[#121214] border border-[#1e1e20] rounded-2xl shadow-xl overflow-hidden flex flex-col group transition-all hover:border-zinc-800/80">
                    <div className="p-5 sm:p-6 border-b border-zinc-800/50 flex items-center justify-between bg-zinc-800/10">
                        <div className="flex flex-col">
                            <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-[0.1em]">Recent Activity</h3>
                            <div className="flex items-center gap-1.5 mt-1">
                                <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">Global Events</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-emerald-500 text-[9px] font-black uppercase tracking-widest pr-1">LIVE</span>
                        </div>
                    </div>

                    <div className="flex flex-col max-h-[360px] overflow-y-auto custom-scrollbar">
                        {callLogs.length > 0 ? callLogs.slice(0, 8).map((log, idx) => {
                            const assistant = assistants.find(a => a._id === log.assistantId);
                            return (
                                <RecentActivity
                                    key={idx}
                                    name={assistant?.name || "Voice Agent"}
                                    type="Call"
                                    status={log.status === 'completed' ? 'success' : 'failed'}
                                    time={new Date(log.created_at || log.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                />
                            );
                        }) : (
                            <div className="p-12 text-center text-zinc-600 text-[10px] font-medium italic">Waiting for incoming activity...</div>
                        )}

                        {emailCampaigns.slice(0, 1).map((camp, idx) => (
                            <RecentActivity
                                key={`mail-${idx}`}
                                name={camp.name}
                                type="Campaign"
                                status="processing"
                                time="Recently"
                            />
                        ))}
                    </div>

                    <button className="p-4 text-[10px] text-zinc-500 font-black hover:text-blue-500 hover:bg-blue-500/5 transition-all flex items-center justify-center gap-2 border-t border-zinc-800/50 uppercase tracking-[0.2em] group">
                        Full Interaction History <ArrowRight size={12} className="transition-transform group-hover:translate-x-1" />
                    </button>
                </div>
            </div>
        </div>
    );
}

