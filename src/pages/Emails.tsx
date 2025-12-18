import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Search, Mail, ArrowRight, Loader2, RefreshCcw } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fetchEmailThreads, fetchEmailMessages, syncEmails, EmailThread, EmailMessage } from "@/lib/api/emails";

export default function Emails() {
    const [threads, setThreads] = useState<EmailThread[]>([]);
    const [messages, setMessages] = useState<EmailMessage[]>([]);
    const [selectedThread, setSelectedThread] = useState<EmailThread | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [loadingThreads, setLoadingThreads] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    // Fetch Threads
    useEffect(() => {
        const loadThreads = async () => {
            setLoadingThreads(true);
            try {
                const data = await fetchEmailThreads(searchQuery);
                if (data.success) {
                    setThreads(data.threads);
                }
            } catch (error) {
                console.error("Failed to fetch threads", error);
            } finally {
                setLoadingThreads(false);
            }
        };

        const timer = setTimeout(() => {
            loadThreads();
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Fetch Messages when thread selected
    useEffect(() => {
        if (!selectedThread) return;

        const loadMessages = async () => {
            setLoadingMessages(true);
            try {
                const data = await fetchEmailMessages(selectedThread.id);
                if (data.success) {
                    setMessages(data.messages);
                }
            } catch (error) {
                console.error("Failed to fetch messages", error);
            } finally {
                setLoadingMessages(false);
            }
        };

        loadMessages();
    }, [selectedThread]);

    const handleSync = async () => {
        setLoadingThreads(true);
        try {
            await syncEmails();
            setTimeout(() => {
                setSearchQuery(prev => prev + " ");
                setTimeout(() => setSearchQuery(prev => prev.trim()), 100);
            }, 3000);
        } catch (e) {
            console.error(e);
            setLoadingThreads(false);
        }
    };

    const cleanupEmailBody = (body: string) => {
        if (!body) return "";
        const lines = body.split('\n');
        const cleanLines: string[] = [];
        for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('On ') && trimmed.endsWith('wrote:')) break;
            if (trimmed.startsWith('From: ')) break;
            if (trimmed.startsWith('>')) break;
            if (trimmed === '________________________________') break;
            cleanLines.push(line);
        }
        return cleanLines.join('\n').trim();
    };

    return (
        <DashboardLayout>
            <div className="flex h-[calc(100vh-140px)] gap-6 overflow-hidden">
                {/* Left Column: Email List */}
                <Card className="w-1/3 flex flex-col border-border/40 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden rounded-xl">
                    <div className="p-4 border-b border-border/40 flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search emails..."
                                className="w-full bg-secondary/50 border-none rounded-lg pl-9 pr-4 py-2 text-sm focus:ring-1 focus:ring-primary outline-none transition-all placeholder:text-muted-foreground"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <button
                            onClick={handleSync}
                            className="p-2 bg-secondary/50 rounded-lg hover:bg-secondary/80 transition-colors shadow-sm"
                            title="Sync Emails"
                        >
                            <RefreshCcw className={`h-4 w-4 text-primary ${loadingThreads ? 'animate-spin' : ''}`} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-2 space-y-1">
                        {loadingThreads ? (
                            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground italic text-sm">
                                <Loader2 className="animate-spin text-primary mb-2" />
                                Syncing inbox...
                            </div>
                        ) : threads.length === 0 ? (
                            <div className="text-center p-12 text-muted-foreground text-sm flex flex-col items-center gap-2 opacity-60">
                                <Mail className="h-8 w-8" />
                                No emails found
                            </div>
                        ) : (
                            threads.map(thread => (
                                <button
                                    key={thread.id}
                                    onClick={() => setSelectedThread(thread)}
                                    className={`w-full text-left p-4 rounded-xl transition-all duration-200 border border-transparent 
                                        ${selectedThread?.id === thread.id
                                            ? 'bg-primary/5 border-primary/20 shadow-sm'
                                            : 'hover:bg-secondary/40'
                                        } `}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <h3 className={`font-bold text-sm truncate pr-2 ${selectedThread?.id === thread.id ? 'text-primary' : 'text-foreground'} `}>
                                            {thread.senderName}
                                        </h3>
                                        <span className="text-[10px] text-muted-foreground whitespace-nowrap opacity-60">
                                            {thread.timestamp ? formatDistanceToNow(new Date(thread.timestamp), { addSuffix: true }) : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold text-foreground/80 mb-1 truncate">
                                        {thread.subject}
                                    </p>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                        {cleanupEmailBody(thread.lastMessage)}
                                    </p>
                                </button>
                            ))
                        )}
                    </div>
                </Card>

                {/* Right Column: Conversation */}
                <Card className="flex-1 flex flex-col border-border/40 shadow-sm bg-card/40 backdrop-blur-sm overflow-hidden rounded-xl">
                    {selectedThread ? (
                        <>
                            <div className="p-5 border-b border-border/20 flex justify-between items-center bg-secondary/5">
                                <div>
                                    <h2 className="font-bold text-xl mb-1">{selectedThread.subject}</h2>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                        <Mail className="h-3 w-3" />
                                        <span className="font-medium">{selectedThread.senderEmail}</span>
                                        <span>•</span>
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-[10px] font-bold">{selectedThread.assistantName || 'AI Assistant'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[url('/dots.png')] bg-repeat">
                                {loadingMessages ? (
                                    <div className="flex flex-col items-center justify-center p-12 text-muted-foreground italic text-sm">
                                        <Loader2 className="animate-spin text-primary mb-2" />
                                        Loading messages...
                                    </div>
                                ) : (
                                    messages.map((message) => (
                                        <div
                                            key={message.id}
                                            className={`flex flex-col ${message.from === 'assistant' ? 'items-end' : 'items-start'} `}
                                        >
                                            <div
                                                className={`max-w-[80%] rounded-2xl p-5 shadow-sm border ${message.from === 'assistant'
                                                    ? 'bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20'
                                                    : 'bg-card border-border/50 text-foreground'
                                                    } `}
                                            >
                                                <p className="text-sm leading-relaxed whitespace-pre-wrap">{cleanupEmailBody(message.content)}</p>
                                            </div>
                                            <div className="flex items-center gap-2 mt-3 px-1 opacity-60">
                                                <span className="text-[9px] uppercase font-black tracking-widest text-muted-foreground">
                                                    {message.from === 'assistant' ? 'Manan AI' : message.senderEmail}
                                                </span>
                                                <span className="text-[9px] text-muted-foreground">•</span>
                                                <span className="text-[9px] text-muted-foreground">
                                                    {message.timestamp ? new Date(message.timestamp).toLocaleString() : ''}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>

                            <div className="p-5 border-t border-border/20 bg-secondary/10">
                                <div className="relative">
                                    <textarea
                                        placeholder="Send a manual reply..."
                                        className="w-full bg-background border border-border/40 rounded-xl p-4 pr-12 text-sm focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none min-h-[100px] shadow-inner"
                                    />
                                    <div className="absolute right-3 bottom-3">
                                        <button className="bg-primary text-primary-foreground p-3 rounded-lg hover:bg-primary/90 transition-all shadow-md active:scale-95">
                                            <ArrowRight className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground/30 p-12 text-center">
                            <div className="h-20 w-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                                <Mail className="h-10 w-10 opacity-30" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground/40 mb-1">No conversation selected</h3>
                            <p className="text-sm max-w-[280px]">Select a thread from the left to view the assistant interaction history.</p>
                        </div>
                    )}
                </Card>
            </div>
        </DashboardLayout>
    );
}
