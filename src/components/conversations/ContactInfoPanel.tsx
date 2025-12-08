import React, { useState, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Phone, Mail, MapPin, Building, Calendar, Plus, Edit, MessageCircle, Save, User } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Conversation } from "./types";
import { ContactProperty } from "./ContactProperty";
import { createContact } from "@/lib/api/contacts/createContact";
import { fetchContactLists } from "@/lib/api/contacts/fetchContactLists";
import { createContactList } from "@/lib/api/contacts/createContactList";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatPhoneNumber } from "@/utils/formatUtils";

interface ContactInfoPanelProps {
  conversation: Conversation;
}

interface ContactList {
  id: string;
  name: string;
  count: number;
}

interface AnalysisData {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  location?: string;
  [key: string]: any;
}

interface StructuredDataField {
  type: string;
  value: string;
  timestamp: string;
  collection_method: string;
}

export function ContactInfoPanel({ conversation }: ContactInfoPanelProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [contactLists, setContactLists] = useState<ContactList[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Get the latest call outcome
  const getLatestCallOutcome = () => {
    if (!conversation.calls || conversation.calls.length === 0) {
      return null;
    }

    // Sort calls by date to get the most recent one
    const sortedCalls = [...conversation.calls].sort((a, b) => 
      new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
    );
    
    // Get the most recent call
    const latestCall = sortedCalls[0];
    
    // Return the resolution/outcome from the latest call
    return latestCall.resolution || latestCall.status || null;
  };

  // Get the latest call timestamp
  const getLatestCallTimestamp = () => {
    if (!conversation.calls || conversation.calls.length === 0) {
      return null;
    }

    // Sort calls by date to get the most recent one
    const sortedCalls = [...conversation.calls].sort((a, b) => 
      new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
    );
    
    // Get the most recent call
    const latestCall = sortedCalls[0];
    
    // Return the timestamp from the latest call
    return latestCall.created_at || latestCall.date || null;
  };

  // Extract analysis data from the most recent call
  const getAnalysisData = (): AnalysisData => {
    if (!conversation.calls || conversation.calls.length === 0) {
      console.log('ContactInfoPanel: No calls found in conversation');
      return {};
    }

    // Sort calls by date to get the most recent one
    const sortedCalls = [...conversation.calls].sort((a, b) => 
      new Date(b.created_at || b.date).getTime() - new Date(a.created_at || a.date).getTime()
    );
    
    // Get the most recent call
    const latestCall = sortedCalls[0];
    
    console.log('ContactInfoPanel: Latest call data:', {
      callId: latestCall.id,
      callName: latestCall.name,
      hasAnalysis: !!latestCall.analysis,
      analysisType: typeof latestCall.analysis,
      analysisContent: latestCall.analysis
    });
    
    // Check if the call has structured_data (analysis results)
    let structuredData = null;
    if (latestCall.analysis && typeof latestCall.analysis === 'object') {
      structuredData = latestCall.analysis;
    } else if ((latestCall as any).structured_data && typeof (latestCall as any).structured_data === 'object') {
      structuredData = (latestCall as any).structured_data;
    } else if (latestCall.analysis && typeof latestCall.analysis === 'string') {
      // Handle case where analysis is stored as JSON string
      try {
        structuredData = JSON.parse(latestCall.analysis);
      } catch (e) {
        console.error('Failed to parse analysis JSON:', e);
      }
    }

    // Debug logging
    console.log('ContactInfoPanel Debug:', {
      latestCallId: latestCall.id,
      hasAnalysis: !!latestCall.analysis,
      analysisType: typeof latestCall.analysis,
      analysisContent: latestCall.analysis,
      structuredDataKeys: structuredData ? Object.keys(structuredData) : null
    });

    if (!structuredData) {
      return {};
    }

    // Extract contact information from the structured data format
    const analysisData: AnalysisData = {};
    
    // Helper function to extract value from structured data field
    const extractValue = (field: any): string | undefined => {
      if (typeof field === 'string') {
        return field;
      } else if (field && typeof field === 'object' && field.value) {
        return field.value;
      }
      return undefined;
    };

    // Map structured data fields to our analysis data
    Object.keys(structuredData).forEach(key => {
      const field = structuredData[key];
      
      switch (key.toLowerCase()) {
        case 'customer name':
        case 'name':
        case 'full name':
        case 'contact name':
        case 'client name':
          analysisData.name = extractValue(field);
          break;
        case 'email address':
        case 'email':
        case 'e-mail':
          analysisData.email = extractValue(field);
          break;
        case 'phone number':
        case 'phone':
        case 'telephone':
        case 'mobile':
          analysisData.phone = extractValue(field);
          break;
        case 'company':
        case 'business':
        case 'organization':
          analysisData.company = extractValue(field);
          break;
        case 'location':
        case 'address':
        case 'city':
          analysisData.location = extractValue(field);
          break;
      }
    });

    return analysisData;
  };

  // Get display name based on whether we have structured name or not
  const getDisplayName = (): string => {
    const analysisData = getAnalysisData();
    const hasStructuredName = analysisData.name && analysisData.name.trim() !== '';
    
    if (hasStructuredName) {
      return analysisData.name; // Only name, no phone number
    } else {
      return formatPhoneNumber(conversation.phoneNumber);
    }
  };

  const analysisData = getAnalysisData();
  const hasAnalysisData = Object.keys(analysisData).length > 0;

  // Load contact lists on component mount
  useEffect(() => {
    const loadContactLists = async () => {
      try {
        const response = await fetchContactLists();
        setContactLists(response.contactLists);
      } catch (error) {
        console.error('Error loading contact lists:', error);
      }
    };

    loadContactLists();
  }, []);

  // Contact properties based on analysis data
  const contactProperties = [
    ...(analysisData.email ? [{ label: "Email", value: analysisData.email, icon: Mail }] : []),
    ...(analysisData.company ? [{ label: "Company", value: analysisData.company, icon: Building }] : []),
    ...(analysisData.location ? [{ label: "Location", value: analysisData.location, icon: MapPin }] : []),
    { label: "Phone", value: formatPhoneNumber(conversation.phoneNumber), icon: Phone },
    { 
      label: "Last Contact", 
      value: (() => {
        const latestTimestamp = getLatestCallTimestamp();
        if (latestTimestamp) {
          return formatDistanceToNow(new Date(latestTimestamp), { addSuffix: true });
        }
        return formatDistanceToNow(conversation.lastActivityTimestamp, { addSuffix: true });
      })(), 
      icon: Calendar 
    },
  ];

  const handleSaveContact = async () => {
    if (!user?.id || !hasAnalysisData) {
      toast({
        title: "Error",
        description: "No analysis data available to save contact",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    try {
      let listId = contactLists[0]?.id;

      // If no contact lists exist, create a default one
      if (!listId) {
        const listResult = await createContactList({
          name: "General Contacts",
          user_id: user.id
        });

        if (listResult.success && listResult.contactList) {
          listId = listResult.contactList.id;
          // Add the new list to our local state
          setContactLists(prev => [...prev, {
            id: listResult.contactList!.id,
            name: listResult.contactList!.name,
            count: 0
          }]);
        } else {
          throw new Error(listResult.error || "Failed to create contact list");
        }
      }

      const contactData = {
        first_name: analysisData.name?.split(' ')[0] || conversation.firstName || 'Unknown',
        last_name: analysisData.name?.split(' ').slice(1).join(' ') || conversation.lastName || '',
        phone: conversation.phoneNumber, // Use actual caller's phone number
        email: analysisData.email || undefined,
        list_id: listId,
        status: 'active' as const,
        do_not_call: false,
        user_id: user.id
      };

      const result = await createContact(contactData);
      
      if (result.success) {
        setIsSaved(true);
        toast({
          title: "Success",
          description: "Contact saved successfully!",
        });
        
        // Update contact list count
        setContactLists(prev => prev.map(list => 
          list.id === listId 
            ? { ...list, count: list.count + 1 }
            : list
        ));
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to save contact",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error saving contact:', error);
      toast({
        title: "Error",
        description: "Failed to save contact",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddProperty = () => {
    // TODO: Implement add property dialog
    console.log("Add property clicked");
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/40">
      {/* Header */}
      <div className="p-6 border-b border-white/5 bg-zinc-800/30 backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Avatar className="h-14 w-14 border-2 border-indigo-500/30">
              <AvatarFallback className="text-lg font-semibold bg-indigo-600/20 text-indigo-200">
                {getInitials(getDisplayName())}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-base font-semibold text-white">
                {getDisplayName()}
              </h2>
              {analysisData.email && (
                <p className="text-xs text-zinc-400 mt-0.5">
                  {analysisData.email}
                </p>
              )}
            </div>
          </div>
          {hasAnalysisData && !isSaved && (
            <Button
              onClick={handleSaveContact}
              disabled={isSaving}
              size="sm"
              variant="outline"
              className="h-8 px-3 text-xs bg-indigo-600/20 border-indigo-500/50 text-indigo-200 hover:bg-indigo-600/30 hover:border-indigo-500/70"
            >
              <Save className="h-3 w-3 mr-1" />
              {isSaving ? 'Saving...' : 'Save'}
            </Button>
          )}
          {isSaved && (
            <Badge variant="secondary" className="flex items-center gap-1 bg-green-600/20 text-green-200 border-green-500/30">
              <User className="h-3 w-3" />
              Saved
            </Badge>
          )}
        </div>
      </div>

      {/* Contact Details */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="space-y-6">
          {/* Overview Stats */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Overview</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="text-xs text-zinc-400 mb-1">Total Calls</div>
                <div className="text-lg font-semibold text-white">{conversation.totalCalls}</div>
              </div>
              <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
                <div className="text-xs text-zinc-400 mb-1">Duration</div>
                <div className="text-lg font-semibold text-white">{conversation.totalDuration}</div>
              </div>
            </div>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Contact Details</h3>
            {hasAnalysisData ? (
              <div className="space-y-2">
                {contactProperties.map((property, index) => (
                  <ContactProperty 
                    key={index}
                    label={property.label} 
                    value={property.value} 
                    icon={property.icon} 
                  />
                ))}
              </div>
            ) : (
              <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30 text-xs text-zinc-500 text-center">
                No analysis data available. Contact information will appear here after call analysis.
              </div>
            )}
          </div>

          {/* Last Call Outcome */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-white">Last Call Outcome</h3>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30">
              {(() => {
                const latestOutcome = getLatestCallOutcome();
                if (!latestOutcome) {
                  return (
                    <Badge variant="default" className="text-xs text-zinc-400 bg-zinc-700/50 px-3 py-1 border border-zinc-600/50">
                      No outcome recorded
                    </Badge>
                  );
                }
                
                return (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-500" />
                    <Badge 
                      variant="secondary" 
                      className="text-xs px-3 py-1 bg-indigo-600/20 text-indigo-200 border-indigo-500/30"
                    >
                      {latestOutcome}
                    </Badge>
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Notes Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white">Notes</h3>
              <Button variant="ghost" size="sm" className="text-xs h-7 px-3 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/50">
                Add Note
              </Button>
            </div>
            <div className="p-4 bg-zinc-800/30 rounded-lg border border-zinc-700/30 text-xs text-zinc-500 text-center">
              No notes yet
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}