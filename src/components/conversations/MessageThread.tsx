import React, { useState, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { Phone, Clock, Mic, MicOff, MessageSquare, Users, Video, Share2, Volume2, Image, Plus, ChevronUp, MoreHorizontal, ChevronLeft } from "lucide-react";

import { format, isSameDay } from "date-fns";
import { Conversation } from "./types";
import { MessageBubble } from "./MessageBubble";
import { ModernMessageInput } from "./ModernMessageInput";
import { SMSMessage } from "@/lib/api/sms/smsService";
import { fetchAssistants, Assistant } from "@/lib/api/assistants/fetchAssistants";
import { fetchPhoneNumberMappings, PhoneNumberMapping } from "@/lib/api/phoneNumbers/fetchPhoneNumberMappings";
import { formatPhoneNumber } from "@/utils/formatUtils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/SupportAccessAuthContext";


interface MessageThreadProps {
  conversation: Conversation;
  messageFilter: 'all' | 'calls' | 'sms';
  onMessageFilterChange: (filter: 'all' | 'calls' | 'sms') => void;
  onBack?: () => void;
}

export function MessageThread({ conversation, messageFilter, onMessageFilterChange, onBack }: MessageThreadProps) {

  // Debug: Log when conversation prop changes
  useEffect(() => {
    console.log('📱 MessageThread received conversation update:', {
      conversationId: conversation.id,
      phoneNumber: conversation.phoneNumber,
      totalSMS: conversation.totalSMS,
      totalCalls: conversation.totalCalls,
      smsMessagesCount: conversation.smsMessages?.length || 0,
      callsCount: conversation.calls?.length || 0,
      lastActivity: conversation.lastActivityTimestamp?.toISOString()
    });
  }, [conversation]);

  const { user } = useAuth();

  const [assistants, setAssistants] = useState<Assistant[]>([]);

  const [loadingAssistants, setLoadingAssistants] = useState(false);
  const [phoneMappings, setPhoneMappings] = useState<PhoneNumberMapping[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("all");
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [scrollPosition, setScrollPosition] = useState(0);
  const [shouldPreserveScroll, setShouldPreserveScroll] = useState(false);
  const lastScrollPositionRef = useRef(0);
  const wasAtBottomRef = useRef(false);

  // Load assistants and phone mappings on component mount
  useEffect(() => {
    const loadData = async () => {
      if (!user?.id) {
        console.warn('🔍 [DIAGNOSTIC] loadData skipped - no user ID');
        return;
      }

      setLoadingAssistants(true);
      try {
        console.log('🔍 [DIAGNOSTIC] loadData started for user:', user.id);

        // Fetch both but handle them separately so one failure doesn't block the other
        const fetchResults = await Promise.allSettled([
          fetchAssistants(user.id),
          fetchPhoneNumberMappings(user.id)
        ]);

        const assistantsRes = fetchResults[0];
        const mappingsRes = fetchResults[1];

        if (assistantsRes.status === 'fulfilled' && assistantsRes.value) {
          const data = assistantsRes.value;
          console.log('🔍 [DIAGNOSTIC] Assistants Response:', data);
          if (data.assistants) {
            console.log(`🔍 [DIAGNOSTIC] Found ${data.assistants.length} assistants`);
            setAssistants(data.assistants);
          } else {
            console.warn('🔍 [DIAGNOSTIC] Assistants list is missing in response object:', data);
            setAssistants([]);
          }
        } else {
          console.error('🔍 [DIAGNOSTIC] Failed to fetch assistants:', assistantsRes.status === 'rejected' ? assistantsRes.reason : 'Invalid response');
          setAssistants([]);
        }

        if (mappingsRes.status === 'fulfilled' && mappingsRes.value) {
          const data = mappingsRes.value;
          console.log('🔍 [DIAGNOSTIC] Phone Mappings Response:', data);
          if (data.mappings) {
            setPhoneMappings(data.mappings);
          }
        } else {
          console.error('🔍 [DIAGNOSTIC] Failed to fetch phone mappings:', mappingsRes.status === 'rejected' ? mappingsRes.reason : 'Invalid response');
        }

      } catch (error) {
        console.error('🔍 [DIAGNOSTIC] Unexpected error in loadData:', error);
      } finally {
        setLoadingAssistants(false);
      }
    };

    loadData();
  }, [user?.id]);


  // Debug message filter changes - moved after allMessages declaration

  // Preserve scroll position when conversation data updates
  useEffect(() => {
    if (shouldPreserveScroll && scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        setTimeout(() => {
          scrollContainer.scrollTop = scrollPosition;
          setShouldPreserveScroll(false);
          console.log('📱 Restored scroll position to:', scrollPosition);
        }, 100);
      }
    }
  }, [conversation, shouldPreserveScroll, scrollPosition]);

  // Check if user is near bottom of scroll area
  const isNearBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        return scrollHeight - scrollTop - clientHeight < 100; // 100px threshold
      }
    }
    return false;
  };

  // Auto-scroll to bottom for new messages if user is near bottom
  useEffect(() => {
    if (conversation.smsMessages && conversation.smsMessages.length > 0) {
      // Use a timeout to ensure the DOM has updated
      setTimeout(() => {
        console.log('📱 Scroll handling for new messages:', {
          smsCount: conversation.smsMessages.length,
          wasAtBottom: wasAtBottomRef.current,
          lastScrollPosition: lastScrollPositionRef.current
        });

        if (wasAtBottomRef.current && scrollAreaRef.current) {
          const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
            console.log('📱 Auto-scrolled to bottom for new messages');
          }
        } else if (!wasAtBottomRef.current && lastScrollPositionRef.current > 0) {
          // Restore previous scroll position
          const scrollContainer = scrollAreaRef.current?.querySelector('[data-radix-scroll-area-viewport]');
          if (scrollContainer) {
            scrollContainer.scrollTop = lastScrollPositionRef.current;
            console.log('📱 Restored scroll position to:', lastScrollPositionRef.current);
          }
        }
      }, 200); // Increased timeout to ensure DOM is ready
    }
  }, [conversation.smsMessages?.length, conversation.calls?.length]);

  // Helper function to scroll to bottom
  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
        console.log('📱 Scrolled to bottom');

        // Update scroll tracking state
        wasAtBottomRef.current = true;
        lastScrollPositionRef.current = scrollContainer.scrollHeight;
      }
    }
  };

  // Auto-scroll to bottom when conversation changes (new conversation selected)
  useEffect(() => {
    // Use a timeout to ensure the DOM has updated with new messages
    setTimeout(() => {
      scrollToBottom();
      console.log('📱 Auto-scrolled to bottom for new conversation selection');
    }, 300); // Slightly longer timeout to ensure all messages are rendered
  }, [conversation.id]); // Trigger when conversation ID changes

  // Auto-scroll to bottom when message filter changes (to show latest messages)
  useEffect(() => {
    // Use a timeout to ensure the DOM has updated with filtered messages
    setTimeout(() => {
      scrollToBottom();
      console.log('📱 Auto-scrolled to bottom for message filter change');
    }, 200);
  }, [messageFilter, selectedAgentId]); // Trigger when filter changes

  // Save scroll position when user scrolls
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        const currentScrollTop = scrollContainer.scrollTop;
        const { scrollHeight, clientHeight } = scrollContainer;
        const isAtBottom = scrollHeight - currentScrollTop - clientHeight < 100;

        setScrollPosition(currentScrollTop);
        lastScrollPositionRef.current = currentScrollTop;
        wasAtBottomRef.current = isAtBottom;

        console.log('📱 Scroll position updated:', {
          scrollTop: currentScrollTop,
          isAtBottom,
          scrollHeight,
          clientHeight
        });
      }
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get display name - either name OR phone number, never both
  const getDisplayName = (): string => {
    // First, check if conversation already has a displayName (from ContactSummary)
    if (conversation.displayName && conversation.displayName !== formatPhoneNumber(conversation.phoneNumber)) {
      // If displayName contains both name and phone (format: "Name - Phone"), extract just the name
      if (conversation.displayName.includes(' - ')) {
        return conversation.displayName.split(' - ')[0];
      }
      // If it's just the name, return it
      return conversation.displayName;
    }

    // Check if conversation has calls with structured data
    if (conversation.calls && conversation.calls.length > 0) {
      const sortedCalls = [...conversation.calls].sort((a, b) =>
        new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
      );

      const latestCall = sortedCalls[0];

      let structuredData = null;
      if (latestCall.analysis && typeof latestCall.analysis === 'object') {
        structuredData = latestCall.analysis;
      } else if ((latestCall as any).structured_data && typeof (latestCall as any).structured_data === 'object') {
        structuredData = (latestCall as any).structured_data;
      }

      if (structuredData) {
        const extractValue = (field: any): string | undefined => {
          if (typeof field === 'string') {
            return field;
          } else if (field && typeof field === 'object' && field.value) {
            return field.value;
          }
          return undefined;
        };

        const customerNameField = structuredData['Customer Name'] || structuredData['name'] || structuredData['full_name'] || structuredData['contact_name'] || structuredData['client_name'];
        if (customerNameField) {
          const extractedName = extractValue(customerNameField);
          if (extractedName && extractedName.trim() !== '') {
            return extractedName; // Only name, no phone number
          }
        }
      }
    }

    // Fallback to formatted phone number if no name found
    const name = formatPhoneNumber(conversation.phoneNumber);
    if (name === 'Web Call' || name.toLowerCase() === 'unknown') {
      return 'Web Call';
    }
    return name;
  };



  // Helper function to get assistant ID for a phone number
  const getAssistantIdForPhoneNumber = (phoneNumber: string): string | null => {
    const mapping = phoneMappings.find(m => m.number === phoneNumber);
    return mapping?.inbound_assistant_id || null;
  };

  // Helper function to get phone number for selected agent
  const getPhoneNumberForSelectedAgent = (): string | null => {
    if (selectedAgentId === "all" || !selectedAgentId) {
      return null; // Use default phone number selection
    }

    const mapping = phoneMappings.find(m => m.inbound_assistant_id === selectedAgentId);
    return mapping?.number || null;
  };



  // Convert calls to messages with proper grouping using created_at timestamp

  const callMessages = conversation.calls.map(call => {
    const assistant = assistants.find(a => a.id === call.assistant_id);
    return {
      id: call.id,
      type: 'call' as const,
      timestamp: new Date(call.created_at || `${call.date}T${call.time}`),
      direction: call.direction,
      duration: call.duration,
      status: call.status,
      resolution: call.resolution,
      summary: call.summary,
      recording: call.call_recording,
      transcript: call.transcript,
      date: call.date,
      time: call.time,
      agentId: call.assistant_id,
      agentName: assistant?.name
    };
  });

  // Convert SMS messages to message format using created_at timestamp
  const smsMessages = (conversation.smsMessages || []).map(sms => {
    // Check both from and to phone numbers for assistant mapping
    const fromAssistantId = getAssistantIdForPhoneNumber(sms.from);
    const toAssistantId = getAssistantIdForPhoneNumber(sms.to);
    const assistantId = fromAssistantId || toAssistantId || undefined;
    const assistant = assistants.find(a => a.id === assistantId);

    return {
      id: sms.messageSid,
      type: 'sms' as const,
      timestamp: new Date(sms.dateCreated), // dateCreated is the created_at timestamp
      direction: sms.direction,
      duration: '0:00',
      status: sms.status,
      resolution: undefined,
      summary: undefined,
      recording: undefined,
      transcript: [{
        speaker: sms.direction === 'inbound' ? 'Customer' : 'Agent',
        time: format(new Date(sms.dateCreated), 'HH:mm'),
        text: sms.body
      }],
      date: format(new Date(sms.dateCreated), 'yyyy-MM-dd'),
      time: format(new Date(sms.dateCreated), 'HH:mm'),
      smsData: sms,
      agentId: assistantId,
      agentName: assistant?.name
    };
  });

  // Combine and sort all messages by created_at timestamp (WhatsApp style - newest at bottom)
  const messages = [...callMessages, ...smsMessages]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());



  // Filter messages by selected agent and message type
  const filteredMessages = messages.filter(message => {
    // First filter by message type
    if (messageFilter === 'calls' && message.type !== 'call') {
      return false;
    }
    if (messageFilter === 'sms' && message.type !== 'sms') {
      return false;
    }

    // Then filter by selected agent if one is selected
    if (selectedAgentId !== "all") {
      // For call messages, check if the call was handled by the selected agent
      if (message.type === 'call') {
        const call = conversation.calls.find(c => c.id === message.id);
        return call?.assistant_id === selectedAgentId;
      }
      // For SMS messages, check if the phone number is mapped to the selected agent
      if (message.type === 'sms' && message.smsData) {
        const sms = message.smsData;
        // Check both from and to phone numbers for assistant mapping
        const fromAssistantId = getAssistantIdForPhoneNumber(sms.from);
        const toAssistantId = getAssistantIdForPhoneNumber(sms.to);

        // Include SMS if either the sender or recipient phone number is mapped to the selected agent
        return fromAssistantId === selectedAgentId || toAssistantId === selectedAgentId;
      }
      return false;
    }

    return true;
  });

  // Combine and sort all messages by created_at timestamp (WhatsApp style - newest at bottom)
  const allMessages = [...filteredMessages]
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  // Debug message filter changes
  useEffect(() => {
    console.log('📱 Message filtering debug:', {
      totalMessages: messages.length,
      filteredMessages: filteredMessages.length,
      allMessages: allMessages.length,
      messageFilter,
      selectedAgentId,
      smsMessages: messages.filter(m => m.type === 'sms').length,
      callMessages: messages.filter(m => m.type === 'call').length,
      filteredSMS: filteredMessages.filter(m => m.type === 'sms').length,
      filteredCalls: filteredMessages.filter(m => m.type === 'call').length,
      conversationSMS: conversation.smsMessages?.length || 0,
      conversationCalls: conversation.calls?.length || 0,
      phoneMappingsCount: phoneMappings.length,
      assistantsCount: assistants.length
    });

    // Additional debug for agent filtering
    if (selectedAgentId !== "all") {
      console.log('🤖 Agent filtering debug:', {
        selectedAgentId,
        callsWithAssistantId: conversation.calls.filter(call => call.assistant_id).length,
        callsWithoutAssistantId: conversation.calls.filter(call => !call.assistant_id).length,
        phoneMappingsForAgent: phoneMappings.filter(m => m.inbound_assistant_id === selectedAgentId),
        smsFromNumbers: conversation.smsMessages?.map(sms => sms.from) || [],
        smsToNumbers: conversation.smsMessages?.map(sms => sms.to) || []
      });
    }
  }, [messageFilter, allMessages.length, messages.length, filteredMessages.length, conversation.smsMessages?.length, conversation.calls?.length, selectedAgentId, phoneMappings.length, assistants.length]);

  // Debug button rendering
  useEffect(() => {
    console.log('MessageThread rendered with conversation:', {
      totalCalls: conversation.totalCalls,
      totalSMS: conversation.totalSMS,
      messageFilter
    });
  }, [conversation.totalCalls, conversation.totalSMS, messageFilter]);

  // Group messages by date
  const groupedMessages = allMessages.reduce((groups, message) => {
    const dateKey = format(message.timestamp, 'yyyy-MM-dd');
    if (!groups[dateKey]) {
      groups[dateKey] = [];
    }
    groups[dateKey].push(message);
    return groups;
  }, {} as Record<string, typeof allMessages>);

  // Sort date groups in ascending order (WhatsApp style - oldest dates first, newest at bottom)
  const sortedDateGroups = Object.entries(groupedMessages)
    .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime());

  return (
    <div className="flex-1 flex flex-col min-h-0">

      {/* Premium Header */}
      <div className="chat-header">
        <div className="chat-header-user">
          {onBack && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden mr-2 -ml-2 text-muted-foreground"
              onClick={onBack}
            >
              <ChevronLeft size={24} />
            </Button>
          )}
          <Avatar className="h-10 w-10 border-2 border-primary/20 bg-background">
            {conversation.avatarUrl ? (
              <img src={conversation.avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <AvatarFallback className="bg-primary/20 text-primary text-sm font-bold">
                {getInitials(getDisplayName())}
              </AvatarFallback>
            )}
          </Avatar>

        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedAgentId} onValueChange={setSelectedAgentId}>
            <SelectTrigger className="w-[180px] h-9 bg-white/5 border-white/10 text-xs font-bold transition-all hover:bg-white/10">
              <div className="flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary" />
                <SelectValue placeholder="Filter by Agent" />
                <span className="ml-1 text-[10px] opacity-30">({assistants?.length || 0})</span>
              </div>
            </SelectTrigger>
            <SelectContent className="bg-[#1A1F2C] border-white/10 text-white z-[10000]">
              <SelectGroup>
                <SelectLabel className="text-[10px] text-white/30 uppercase tracking-widest px-2 py-1.5">
                  Available Agents ({assistants.length})
                </SelectLabel>
                <SelectItem value="all" className="text-xs focus:bg-primary/20 cursor-pointer">
                  All Agents
                </SelectItem>
                {assistants.length > 0 && assistants.map((assistant) => (
                  <SelectItem
                    key={assistant.id || (assistant as any)._id}
                    value={assistant.id || (assistant as any)._id}
                    className="text-xs focus:bg-primary/20 cursor-pointer"
                  >
                    {assistant.name || 'Unnamed Agent'}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar chat-messages" ref={scrollAreaRef} onScrollCapture={handleScroll}>
        <div className="flex flex-col gap-6">
          {sortedDateGroups.map(([dateKey, dayMessages]) => (
            <div key={dateKey} className="flex flex-col gap-4">

              {dayMessages.map((message, index) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  conversation={conversation}
                  showAvatar={index === 0 || dayMessages[index - 1]?.direction !== message.direction}
                />
              ))}
            </div>
          ))}


        </div>
      </div>


      {/* Modern SMS Input Section */}
      <ModernMessageInput
        conversation={conversation}
        selectedAgentPhoneNumber={getPhoneNumberForSelectedAgent()}
        isDisabled={selectedAgentId === "all"}
      />
    </div>
  );
}