import React from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, Clock, MessageSquare, Check, CheckCheck, AlertTriangle, RotateCcw, Loader2, FileText, ExternalLink, ChevronRight, ChevronDown, Users } from "lucide-react";

import { format } from "date-fns";
import { Conversation } from "./types";
import { normalizeResolution } from "@/components/dashboard/call-outcomes/utils";
import { CompactAudioPlayer } from "@/components/ui/compact-audio-player";
import { InlineTranscriptView } from "./InlineTranscriptView";
import { TranscriptExpandDialog } from "./TranscriptExpandDialog";
import { SummaryExpandDialog } from "./SummaryExpandDialog";
import { SMSMessage } from "@/lib/api/sms/smsService";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { formatSummaryForDisplay } from "@/utils/summaryUtils";



interface MessageBubbleProps {
  message: {
    id: string;
    type: 'call' | 'sms' | 'whatsapp' | 'imessage';
    timestamp: Date;
    direction: string;
    duration?: string;
    status?: string;
    resolution?: string;
    summary?: string;
    recording?: string;
    transcript?: any;
    date: string;
    time: string;
    isLive?: boolean;
    confidence?: number;
    smsData?: SMSMessage;
    channel?: 'sms' | 'whatsapp' | 'imessage';
    body?: string;
    deliveryStatus?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
    effects?: string;
    agentName?: string;
    agentId?: string;
  };
  conversation: Conversation;
  showAvatar?: boolean;
  onRetryMessage?: (messageId: string) => Promise<void>;
}

export function MessageBubble({ message, conversation, showAvatar = true, onRetryMessage }: MessageBubbleProps) {

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get channel-specific styling
  const getChannelStyles = (channel: string, isIncoming: boolean) => {
    const baseStyles = "px-3 py-2 rounded-xl backdrop-blur-sm border";

    if (isIncoming) {
      return cn(baseStyles, "message-bubble-incoming");
    }

    return cn(baseStyles, "message-bubble-outgoing");
  };

  // Handle retry message
  const handleRetryMessage = async () => {
    if (onRetryMessage) {
      try {
        await onRetryMessage(message.id);
        toast({
          title: "Message Retry",
          description: "Attempting to resend message...",
        });
      } catch (error) {
        toast({
          title: "Retry Failed",
          description: "Unable to retry message. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  // Get status color and tooltip text
  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'sending':
        return {
          color: 'hsl(var(--status-sending))',
          tooltip: 'Message is being sent...',
          className: 'status-sending'
        };
      case 'sent':
        return {
          color: 'hsl(var(--status-delivered))',
          tooltip: 'Message sent successfully',
          className: ''
        };
      case 'delivered':
        return {
          color: 'hsl(var(--status-delivered))',
          tooltip: 'Message delivered to recipient',
          className: ''
        };
      case 'read':
        return {
          color: 'hsl(var(--status-read))',
          tooltip: 'Message read by recipient',
          className: ''
        };
      case 'failed':
        return {
          color: 'hsl(var(--status-failed))',
          tooltip: 'Failed to send message. Click to retry.',
          className: 'status-failed'
        };
      default:
        return {
          color: 'hsl(var(--muted-foreground))',
          tooltip: 'Unknown status',
          className: ''
        };
    }
  };

  // Render delivery status indicators
  const renderDeliveryStatus = (message: any) => {
    if (!message.deliveryStatus || message.direction === 'inbound') return null;

    const statusInfo = getStatusInfo(message.deliveryStatus);

    // Common status indicators for all channels
    const renderStatusIcon = () => {
      switch (message.deliveryStatus) {
        case 'sending':
          return <Loader2 className="w-3 h-3 animate-spin" style={{ color: statusInfo.color }} />;
        case 'failed':
          return (
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" style={{ color: statusInfo.color }} />
              {onRetryMessage && (
                <Button
                  onClick={handleRetryMessage}
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs hover:bg-transparent"
                  style={{ color: statusInfo.color }}
                >
                  <RotateCcw className="w-2.5 h-2.5" />
                </Button>
              )}
            </div>
          );
        default:
          break;
      }

      // Channel-specific indicators for successful states
      switch (message.channel) {
        case 'whatsapp':
          return (
            <div className="flex items-center space-x-0.5">
              {message.deliveryStatus === 'read' ? (
                <CheckCheck className="w-3 h-3" style={{ color: statusInfo.color }} />
              ) : (
                <CheckCheck className="w-3 h-3" style={{ color: statusInfo.color }} />
              )}
            </div>
          );
        case 'imessage':
          return (
            <div className="text-[9px]" style={{ color: statusInfo.color }}>
              {message.deliveryStatus === 'delivered' && 'Delivered'}
              {message.deliveryStatus === 'read' && 'Read'}
              {message.deliveryStatus === 'sent' && 'Sent'}
            </div>
          );
        case 'sms':
          return (
            <div className="text-[9px]" style={{ color: statusInfo.color }}>
              {message.deliveryStatus === 'delivered' && 'Delivered'}
              {message.deliveryStatus === 'sent' && 'Sent'}
            </div>
          );
        default:
          return <Check className="w-3 h-3" style={{ color: statusInfo.color }} />;
      }
    };

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={cn("flex items-center", statusInfo.className)}>
              {renderStatusIcon()}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="text-xs">{statusInfo.tooltip}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const getOutcomeBadgeColor = (outcome?: string) => {
    if (!outcome) return "secondary";
    const normalized = normalizeResolution(outcome).toLowerCase();

    if (normalized.includes('appointment') || normalized.includes('booked')) {
      return "default";
    } else if (normalized.includes('qualified') && !normalized.includes('not')) {
      return "secondary";
    } else if (normalized.includes('spam')) {
      return "destructive";
    } else if (normalized.includes('not qualified') || normalized.includes('not eligible')) {
      return "outline";
    }
    return "secondary";
  };

  const isIncoming = message.direction === 'inbound';

  if (message.type === 'sms' || message.type === 'whatsapp' || message.type === 'imessage' || message.type === 'call') {
    const isCall = message.type === 'call';

    // Robust check for details
    const hasRecording = !!message.recording;
    const hasTranscript = message.transcript && (
      (Array.isArray(message.transcript) && message.transcript.length > 0) ||
      (typeof message.transcript === 'string' && message.transcript.length > 0) ||
      (typeof message.transcript === 'object' && Object.keys(message.transcript).length > 0)
    );
    const hasSummary = !!message.summary && message.summary.trim().length > 0;
    const hasAnyDetails = hasRecording || hasTranscript || hasSummary;

    return (
      <div className={`message-group ${isIncoming ? '' : 'message-right'}`}>
        <div className={`flex items-end gap-3 ${isIncoming ? 'flex-row' : 'flex-row-reverse'}`}>
          {isIncoming && (
            <Avatar className="h-8 w-8 border border-white/10">
              <AvatarFallback className="bg-primary/20 text-primary text-[10px] font-bold">
                {getInitials(conversation.displayName)}
              </AvatarFallback>
            </Avatar>
          )}

          <div className="flex flex-col">
            <div className={`flex items-center gap-2 mb-1 px-1 ${isIncoming ? 'justify-start' : 'justify-end'}`}>
              <span className="text-[11px] font-bold text-white/50">
                {isIncoming ? conversation.displayName : 'You'}
              </span>
              <span className="text-[10px] text-white/30">
                {format(message.timestamp, 'h:mm a')}
              </span>
            </div>

            <div
              className={cn(
                "message-bubble-premium transition-all min-w-[280px] max-w-[400px]",
                isIncoming ? "message-bubble-left" : "message-bubble-right",
                isCall && "p-4 hover:ring-1 hover:ring-white/10"
              )}
            >
              {isCall ? (
                <div className="flex flex-col gap-3">
                  {/* Header Row */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-lg bg-primary/10">
                        <Phone className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <span className="text-sm font-bold text-white/90">
                        {isIncoming ? 'Incoming' : 'Outgoing'} Call
                      </span>
                      {message.resolution && (
                        <Badge
                          variant={getOutcomeBadgeColor(message.resolution)}
                          className="px-2 py-0 h-4.5 text-[10px] uppercase font-bold tracking-wider"
                        >
                          {normalizeResolution(message.resolution)}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Duration & Status Row */}
                  <div className="flex items-center gap-4 text-white/40 text-[11px] font-medium">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span className="tabular-nums">{message.duration || '0:00'}</span>
                    </div>
                    {message.agentName && (
                      <>
                        <span>•</span>
                        <div className="flex items-center gap-1.5">
                          <Users className="w-3 h-3 text-primary/70" />
                          <span className="text-white/60">{message.agentName}</span>
                        </div>
                      </>
                    )}
                    <span>•</span>
                    <span className="capitalize">{message.resolution || 'No interest'}</span>
                  </div>

                  {/* Summary Section */}
                  <div className="relative group/summary mt-1">
                    {hasSummary ? (
                      <div className="flex items-start gap-3">
                        <p className="text-[13px] leading-relaxed text-white/70 flex-1 line-clamp-3 italic">
                          "{formatSummaryForDisplay(message.summary)}"
                        </p>
                        <SummaryExpandDialog
                          summary={formatSummaryForDisplay(message.summary!)}
                          trigger={
                            <button className="p-1 hover:bg-white/5 rounded transition-colors text-white/20 hover:text-white/60">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          }
                        />
                      </div>
                    ) : (
                      <p className="text-[12px] text-white/30 italic">No summary generated for this call.</p>
                    )}
                  </div>

                  {/* Audio Player Section */}
                  {hasRecording && (
                    <div className="my-1 animate-in fade-in slide-in-from-top-2 duration-300">
                      <CompactAudioPlayer
                        src={message.recording!}
                        className="bg-white/5 border-white/10 rounded-xl"
                      />
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="flex items-center justify-between pt-2 mt-1 border-t border-white/5">
                    {hasTranscript ? (
                      <TranscriptExpandDialog
                        transcript={message.transcript}
                        trigger={
                          <button className="flex items-center gap-2 text-white/60 hover:text-white/90 transition-colors group/transcript">
                            <FileText className="w-4 h-4 text-primary/70 group-hover/transcript:text-primary transition-colors" />
                            <span className="text-[12px] font-bold">Transcript</span>
                            <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover/transcript:opacity-100 transition-all" />
                          </button>
                        }
                      />
                    ) : (
                      <div className="flex items-center gap-2 opacity-30 cursor-not-allowed">
                        <FileText className="w-4 h-4" />
                        <span className="text-[12px] font-bold">No Transcript</span>
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      {hasRecording && (
                        <SummaryExpandDialog
                          summary={formatSummaryForDisplay(message.summary || "No summary available")}
                          trigger={
                            <button className="p-1.5 hover:bg-white/5 rounded-full transition-colors text-white/40 hover:text-white/80">
                              <ExternalLink className="w-4 h-4" />
                            </button>
                          }
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-wrap">
                  {message.body || message.smsData?.body}
                </p>
              )}
            </div>
            {!isIncoming && renderDeliveryStatus(message)}
          </div>
        </div>
      </div>
    );
  }
  return null;
}

