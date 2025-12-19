import React, { useState, useMemo, useEffect, useRef } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { ThemeContainer, ThemeSection, ThemeCard } from "@/components/theme";
import { MessageThread } from "@/components/conversations/MessageThread";
import { Conversation } from "@/components/conversations/types";
import { getConversationsProgressive, ContactSummary } from "@/lib/api/conversations/fetchConversations";
import ConversationsToolbar from "@/components/conversations/ConversationsToolbar";
import { useConversationsFilter } from "@/components/conversations/hooks/useConversationsFilter";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useRouteChangeData } from "@/hooks/useRouteChange";
import { useToast } from "@/hooks/use-toast";
import { format } from 'date-fns';
import { formatPhoneNumber } from "@/utils/formatUtils";
import { Search, MoreHorizontal } from "lucide-react";

export default function Conversations() {
  const { user, loading: isAuthLoading } = useAuth();
  const { toast } = useToast();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingContacts, setIsLoadingContacts] = useState(true);
  const [isLoadingConversation, setIsLoadingConversation] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState<Date | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisibleRef = useRef(true);
  const hasInitiallySelectedRef = useRef(false);
  const hasManualSelectionRef = useRef(false);
  const [messageFilter, setMessageFilter] = useState<'all' | 'calls' | 'sms'>('all');

  // Progressive loading functions
  const [progressiveFunctions, setProgressiveFunctions] = useState<{
    getConversationDetails: (phoneNumber: string, days?: number) => Promise<any>;
    loadMoreHistory: (phoneNumber: string, offset?: number, limit?: number) => Promise<any>;
    fetchNewMessagesSince: (phoneNumber: string, sinceTimestamp: string) => Promise<any>;
  } | null>(null);

  // Track last message timestamps for each conversation
  const [lastMessageTimestamps, setLastMessageTimestamps] = useState<Record<string, string>>({});

  // Load contacts list (fast initial load)
  const loadContacts = async () => {
    if (isAuthLoading || !user?.id) {
      setIsLoadingContacts(false);
      return;
    }

    try {
      setIsLoadingContacts(true);
      setError(null);

      console.log('📋 Loading contacts list...');
      const { contacts: contactList, getConversationDetails, loadMoreHistory, fetchNewMessagesSince } = await getConversationsProgressive();

      console.log(`📋 Loaded ${contactList.length} contacts`);
      setContacts(contactList);
      setProgressiveFunctions({ getConversationDetails, loadMoreHistory, fetchNewMessagesSince });

    } catch (err) {
      console.error('Error loading contacts:', err);
      setError('Failed to load contacts - showing sample data');
      // Set fallback contacts
      const fallbackContacts: ContactSummary[] = [
        {
          id: 'contact_1',
          phoneNumber: '+1234567890',
          displayName: 'John Doe',
          firstName: 'John',
          lastName: 'Doe',
          lastActivityDate: new Date().toISOString().split('T')[0],
          lastActivityTime: new Date().toLocaleTimeString('en-US', { hour12: false }).slice(0, 5),
          lastActivityTimestamp: new Date(),
          totalCalls: 2,
          totalSMS: 5,
          lastCallOutcome: 'Completed',
          totalDuration: '5:30',
          outcomes: {
            appointments: 1,
            qualified: 1,
            notQualified: 0,
            spam: 0
          }
        }
      ];
      setContacts(fallbackContacts);
    } finally {
      setIsLoadingContacts(false);
    }
  };

  // Check for new messages since last timestamp
  const checkForNewMessages = async (phoneNumber: string) => {
    if (!progressiveFunctions?.fetchNewMessagesSince) {
      console.warn('Progressive functions not available for checking new messages');
      return;
    }

    const lastTimestamp = lastMessageTimestamps[phoneNumber];
    if (!lastTimestamp) {
      console.log(`No previous timestamp for ${phoneNumber}, skipping new message check`);
      return;
    }

    try {
      console.log(`🔄 Checking for new messages for ${phoneNumber} since ${lastTimestamp}`);
      const { newSMSMessages, newCalls, hasNewData } = await progressiveFunctions.fetchNewMessagesSince(phoneNumber, lastTimestamp);

      if (hasNewData) {
        console.log(`📨 Found ${newSMSMessages.length} new SMS and ${newCalls.length} new calls for ${phoneNumber}`);

        // Update the conversation with new messages
        setConversations(prevConversations =>
          prevConversations.map(conv => {
            if (conv.phoneNumber === phoneNumber) {
              const updatedConv = { ...conv };

              // Add new SMS messages
              if (newSMSMessages.length > 0) {
                updatedConv.smsMessages = [...(conv.smsMessages || []), ...newSMSMessages];
                updatedConv.totalSMS = updatedConv.smsMessages.length;

                // Update last activity if SMS is newer
                const latestSMS = newSMSMessages[newSMSMessages.length - 1];
                const smsTime = new Date(latestSMS.dateCreated);
                if (smsTime > conv.lastActivityTimestamp) {
                  updatedConv.lastActivityDate = format(smsTime, 'yyyy-MM-dd');
                  updatedConv.lastActivityTime = format(smsTime, 'HH:mm');
                  updatedConv.lastActivityTimestamp = smsTime;
                }
              }

              // Add new calls
              if (newCalls.length > 0) {
                updatedConv.calls = [...conv.calls, ...newCalls];
                updatedConv.totalCalls = updatedConv.calls.length;

                // Update last activity if call is newer
                const latestCall = newCalls[newCalls.length - 1];
                const callTime = new Date(latestCall.created_at);
                if (callTime > conv.lastActivityTimestamp) {
                  updatedConv.lastActivityDate = latestCall.date;
                  updatedConv.lastActivityTime = latestCall.time;
                  updatedConv.lastActivityTimestamp = callTime;
                  updatedConv.lastCallOutcome = latestCall.resolution;
                }
              }

              return updatedConv;
            }
            return conv;
          })
        );

        // Update the selected conversation if it's the one being updated
        if (selectedConversation?.phoneNumber === phoneNumber) {
          setSelectedConversation(prev => {
            if (!prev) return prev;

            const updatedConv = { ...prev };

            // Add new SMS messages
            if (newSMSMessages.length > 0) {
              updatedConv.smsMessages = [...(prev.smsMessages || []), ...newSMSMessages];
              updatedConv.totalSMS = updatedConv.smsMessages.length;
            }

            // Add new calls
            if (newCalls.length > 0) {
              updatedConv.calls = [...prev.calls, ...newCalls];
              updatedConv.totalCalls = updatedConv.calls.length;
            }

            return updatedConv;
          });
        }

        // Update the last timestamp
        const allMessages = [...newSMSMessages.map(sms => ({ timestamp: sms.dateCreated, type: 'sms' })),
        ...newCalls.map(call => ({ timestamp: call.created_at, type: 'call' }))];

        if (allMessages.length > 0) {
          const latestMessage = allMessages.sort((a, b) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
          )[allMessages.length - 1];

          setLastMessageTimestamps(prev => ({
            ...prev,
            [phoneNumber]: latestMessage.timestamp
          }));
        }
      }
    } catch (error) {
      console.error('Error checking for new messages:', error);
    }
  };

  // Load conversation details for a specific contact
  const loadConversationDetails = async (phoneNumber: string) => {
    if (!progressiveFunctions) {
      console.error('Progressive functions not available');
      return;
    }

    try {
      setIsLoadingConversation(true);
      console.log(`📞 Loading conversation details for ${phoneNumber}...`);

      // Always load ALL call history, not filtered by date range
      // Passing null explicitly to ensure all calls are loaded
      const response = await progressiveFunctions.getConversationDetails(phoneNumber, null);
      const conversation = response.conversation;

      console.log(`📞 Loaded conversation with ${conversation.calls.length} calls and ${conversation.smsMessages.length} SMS messages`);

      // Convert to the format expected by the UI
      const conversationWithFlags = {
        ...conversation,
        hasNewMessages: false,
        hasNewSMS: false,
        hasNewCalls: false
      };

      setConversations(prev => {
        const existing = prev.find(c => c.phoneNumber === phoneNumber);
        if (existing) {
          return prev.map(c => c.phoneNumber === phoneNumber ? conversationWithFlags : c);
        } else {
          return [...prev, conversationWithFlags];
        }
      });

      // Set initial timestamp for this conversation
      const allMessages = [
        ...(conversation.smsMessages || []).map(sms => ({ timestamp: sms.dateCreated, type: 'sms' })),
        ...conversation.calls.map(call => ({ timestamp: call.created_at, type: 'call' }))
      ];

      if (allMessages.length > 0) {
        const latestMessage = allMessages.sort((a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        )[allMessages.length - 1];

        setLastMessageTimestamps(prev => ({
          ...prev,
          [phoneNumber]: latestMessage.timestamp
        }));

        console.log(`📅 Set initial timestamp for ${phoneNumber}: ${latestMessage.timestamp}`);
      }

      return conversationWithFlags;

    } catch (err) {
      console.error('Error loading conversation details:', err);
      toast({
        title: "Error",
        description: "Failed to load conversation details",
        variant: "destructive"
      });
    } finally {
      setIsLoadingConversation(false);
    }
  };

  // Legacy function for compatibility (now just loads contacts)
  const loadConversations = async (isPolling = false, shouldSort = true) => {
    if (isPolling) {
      // For polling, don't reload contacts if we already have them
      if (contacts.length === 0) {
        await loadContacts();
      }
    } else {
      // For initial load, load contacts
      await loadContacts();
    }
  };

  useEffect(() => {
    // Add a small delay to prevent race conditions
    const timer = setTimeout(() => {
      loadConversations();
    }, 100);

    return () => clearTimeout(timer);
  }, [isAuthLoading, user?.id]);

  // Trigger API call on route changes
  useRouteChangeData(loadConversations, [isAuthLoading, user?.id], {
    enabled: !isAuthLoading && !!user?.id,
    refetchOnRouteChange: true
  });

  // Start/stop polling based on authentication and page visibility
  useEffect(() => {
    if (!isAuthLoading && user?.id) {
      // Start polling every 30 seconds to check for new messages
      setIsPolling(true);
      pollingIntervalRef.current = setInterval(async () => {
        console.log('🔄 Polling: Checking for new messages...', new Date().toLocaleTimeString());

        // Check for new messages in currently selected conversation
        if (selectedConversation) {
          await checkForNewMessages(selectedConversation.phoneNumber);
        }

        // Also refresh contact list (lightweight)
        await loadContacts();
      }, 30000); // Poll every 30 seconds

      return () => {
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
        setIsPolling(false);
      };
    } else {
      // Stop polling if user is not authenticated
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      setIsPolling(false);
    }
  }, [isAuthLoading, user?.id, selectedConversation]);

  // Handle page visibility changes
  useEffect(() => {
    const handleVisibilityChange = async () => {
      isPageVisibleRef.current = !document.hidden;

      // If page becomes visible and we haven't updated in a while, check for new messages
      if (!document.hidden && lastUpdateTime) {
        const timeSinceLastUpdate = Date.now() - lastUpdateTime.getTime();
        if (timeSinceLastUpdate > 30000) { // If more than 30 seconds since last update
          // Check for new messages in currently selected conversation
          if (selectedConversation) {
            await checkForNewMessages(selectedConversation.phoneNumber);
          }
          // Also refresh contact list
          await loadContacts();
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [lastUpdateTime]);

  // Use conversations filter hook with real data
  const {
    searchQuery,
    setSearchQuery,
    resolutionFilter,
    setResolutionFilter,
    dateRange,
    setDateRange,
    conversations: filteredConversations,
    filteredCount
  } = useConversationsFilter(conversations);

  const getDisplayName = (item: Conversation | ContactSummary): string => {
    let name = '';
    if (item.displayName && item.displayName !== formatPhoneNumber(item.phoneNumber)) {
      // If displayName contains both name and phone (format: "Name - Phone"), extract just the name
      if (item.displayName.includes(' - ')) {
        name = item.displayName.split(' - ')[0];
      } else {
        name = item.displayName;
      }
    } else {
      name = formatPhoneNumber(item.phoneNumber);
    }

    if (name.toLowerCase() === 'unknown' || name === '') {
      return 'Web Call';
    }
    return name;
  };


  // Create a combined list for the UI (contacts + loaded conversations)
  const displayItems = useMemo(() => {
    const combined = [...contacts, ...conversations];
    // Remove duplicates based on phone number
    const unique = combined.filter((item, index, self) =>
      index === self.findIndex(t => t.phoneNumber === item.phoneNumber)
    );

    // Apply message category filter
    let filtered = unique;
    if (messageFilter === 'calls') {
      filtered = filtered.filter(item => item.totalCalls > 0);
    } else if (messageFilter === 'sms') {
      filtered = filtered.filter(item => item.totalSMS > 0);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.displayName?.toLowerCase().includes(query) ||
        item.phoneNumber?.includes(query)
      );
    }

    return filtered;
  }, [contacts, conversations, searchQuery, messageFilter]);

  // Auto-select first conversation on initial load only
  useEffect(() => {
    console.log('🔄 Auto-selection check:', {
      displayItemsLength: displayItems.length,
      selectedConversationId: selectedConversation?.id,
      hasInitiallySelected: hasInitiallySelectedRef.current,
      hasManualSelection: hasManualSelectionRef.current,
      isLoadingContacts
    });

    // Only auto-select if:
    // 1. We have display items
    // 2. No conversation is selected
    // 3. We haven't made any selection yet (initial or manual)
    // 4. We're not loading
    if (displayItems.length > 0 &&
      !selectedConversation &&
      !hasInitiallySelectedRef.current &&
      !hasManualSelectionRef.current &&
      !isLoadingContacts) {
      console.log('🎯 Auto-selecting first item:', displayItems[0].id);
      handleSelectConversation(displayItems[0]);
      hasInitiallySelectedRef.current = true;
    }
  }, [displayItems.length, isLoadingContacts]);

  // Reset selected conversation if it's no longer in filtered results
  useEffect(() => {
    if (selectedConversation && !displayItems.find(c => c.id === selectedConversation.id)) {
      if (displayItems.length > 0) {
        handleSelectConversation(displayItems[0]);
      } else {
        setSelectedConversation(null);
      }
    }
  }, [displayItems.length, selectedConversation?.id]);

  const handleSelectConversation = async (conversation: Conversation | ContactSummary) => {
    console.log('🎯 Manual conversation selection:', conversation.id);
    hasInitiallySelectedRef.current = true; // Mark that we've made a selection
    hasManualSelectionRef.current = true; // Mark that we've made a manual selection

    // If it's already a full conversation, use it directly
    if ('calls' in conversation && 'smsMessages' in conversation) {
      setSelectedConversation(conversation as Conversation);
      return;
    }

    // If it's a contact summary, load the full conversation details
    const contact = conversation as ContactSummary;
    console.log(`📞 Loading conversation details for contact: ${contact.phoneNumber}`);

    const fullConversation = await loadConversationDetails(contact.phoneNumber);
    if (fullConversation) {
      setSelectedConversation({
        ...fullConversation,
        avatarUrl: contact.avatarUrl,
        isOnline: contact.isOnline
      });
    }

    // Clear new message flags for the selected conversation
    setConversations(prevConversations =>
      prevConversations.map(conv =>
        conv.id === conversation.id
          ? { ...conv, hasNewMessages: false, hasNewSMS: false, hasNewCalls: false }
          : conv
      )
    );
  };

  // Only show loading screen for auth or initial contact loading, not for conversation details
  if (isAuthLoading || (isLoadingContacts && contacts.length === 0)) {
    return (
      <DashboardLayout>
        <ThemeContainer variant="base" className="no-hover-scaling">
          <div className="container mx-auto px-[var(--space-lg)]">
            <div className="max-w-6xl mx-auto">
              <ThemeSection spacing="lg">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">
                      {isAuthLoading ? 'Authenticating...' : 'Loading contacts...'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {contacts.length > 0 ? `Found ${contacts.length} contacts` : 'No contacts yet'}
                    </p>
                  </div>
                </div>
              </ThemeSection>
            </div>
          </div>
        </ThemeContainer>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <ThemeContainer variant="base" className="no-hover-scaling">
          <div className="container mx-auto px-[var(--space-lg)]">
            <div className="max-w-6xl mx-auto">
              <ThemeSection spacing="lg">
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="text-destructive mb-4">
                      <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">Error Loading Conversations</h3>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <button
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Try Again
                    </button>
                  </div>
                </div>
              </ThemeSection>
            </div>
          </div>
        </ThemeContainer>
      </DashboardLayout>
    );
  }


  return (
    <DashboardLayout>
      <div className={`chat-premium-container ${selectedConversation ? 'sidebar-hidden' : ''}`}>
        {/* Left Sidebar - Chat List */}
        <div className="chat-sidebar">
          <div className="chat-sidebar-header">
            <h1 className="chat-sidebar-title">Chats</h1>
            <div className="flex items-center gap-2">
              <button className="chat-search-trigger p-2 hover:bg-white/5 rounded-full transition-colors">
                <Search className="w-5 h-5" />
              </button>
              <button className="chat-search-trigger p-2 hover:bg-white/5 rounded-full transition-colors">
                <MoreHorizontal className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Sidebar Search Bar */}
          <div className="chat-sidebar-search">
            <div className="search-input-wrapper">
              <Search className="w-4 h-4 text-white/20" />
              <input
                type="text"
                className="sidebar-search-input"
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Sidebar Category Filters */}
          <div className="chat-filters custom-scrollbar">
            <div
              className={`filter-tab ${messageFilter === 'all' ? 'active' : ''}`}
              onClick={() => setMessageFilter('all')}
            >
              All
            </div>
            <div
              className={`filter-tab ${messageFilter === 'calls' ? 'active' : ''}`}
              onClick={() => setMessageFilter('calls')}
            >
              Calls
            </div>
            <div
              className={`filter-tab ${messageFilter === 'sms' ? 'active' : ''}`}
              onClick={() => setMessageFilter('sms')}
            >
              SMS
            </div>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {/* Conversations List Section */}
            <div className="chat-list-section">
              <div className="chat-list-section-header">
                <span>Recent Conversations</span>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
              {displayItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleSelectConversation(item)}
                  className={`chat-item ${selectedConversation?.id === item.id ? 'active' : ''}`}
                >
                  <div className="chat-item-avatar">
                    {(item as any).avatarUrl ? (
                      <img src={(item as any).avatarUrl} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold">{getDisplayName(item).charAt(0).toUpperCase()}</span>
                    )}
                    {(item as any).hasNewMessages && <div className="status-indicator status-unread" />}
                    {(item as any).isOnline && <div className="status-indicator status-online" />}
                  </div>
                  <div className="chat-item-info">
                    <div className="chat-item-name">{getDisplayName(item)}</div>

                  </div>
                </div>
              ))}

              {displayItems.length === 0 && (
                <div className="p-8 text-center opacity-30">
                  <p className="text-sm">No conversations found</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Area - Conversation View */}
        <div className="chat-main">
          {selectedConversation ? (
            <MessageThread
              key={selectedConversation.id}
              conversation={selectedConversation}
              messageFilter={messageFilter}
              onMessageFilterChange={setMessageFilter}
              onBack={() => {
                setSelectedConversation(null);
                hasManualSelectionRef.current = false;
              }}
            />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center opacity-40">
              <div className="w-24 h-24 mb-6 relative">
                <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse" />
                <svg className="w-full h-full text-blue-500 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold mb-2">Select a Chat</h2>
              <p className="text-sm">Choose a conversation from the sidebar to start</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}