import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown, ChevronRight, Loader2, X, Search, Phone, Calendar, CheckCircle2 } from "lucide-react";
import { ModelData } from "./types";
import { WizardSlider } from "./WizardSlider";
import { Input } from "@/components/ui/input";
import { getKnowledgeBases, type KnowledgeBase } from "@/lib/api/knowledgeBase";
import { CalendarCredentialsService, type UserCalendarCredentials } from "@/lib/calendar-credentials";
import { CalendarEventTypeService, type CalendarEventType, type CalComEventType, fetchEventTypesFromCalCom } from "@/lib/calendar-event-types";
// EventTypeSelector removed - using simple event slug input instead
import { useToast } from "@/hooks/use-toast";

// Predefined idle message options
const IDLE_MESSAGE_OPTIONS = [
  "Are you still there?",
  "I'm still here if you need anything",
  "Did you have any other questions?",
  "Let me know if you need help with anything else",
  "Are we still connected?",
  "I'm listening whenever you're ready",
  "Take your time, I'll wait",
  "Is everything okay?",
  "Would you like me to repeat anything?",
  "I'm here when you're ready to continue",
  "Please let me know if you need assistance",
  "I'm waiting for your response"
];

interface ModelTabProps {
  data: ModelData;
  onChange: (data: Partial<ModelData>) => void;
}

export const ModelTab: React.FC<ModelTabProps> = ({ data, onChange }) => {
  const [knowledgeBases, setKnowledgeBases] = useState<KnowledgeBase[]>([]);
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(false);
  const [knowledgeBaseError, setKnowledgeBaseError] = useState<string | null>(null);
  const [calendarCredentials, setCalendarCredentials] = useState<UserCalendarCredentials[]>([]);
  const [loadingCalendarCredentials, setLoadingCalendarCredentials] = useState(false);
  const [eventTypes, setEventTypes] = useState<CalComEventType[]>([]);
  const [loadingEventTypes, setLoadingEventTypes] = useState(false);
  const [eventTypesError, setEventTypesError] = useState<string | null>(null);
  const { toast } = useToast();

  // Check if assistant has calendar API key
  const hasCalendarApiKey = () => {
    return !!data.calApiKey;
  };



  const handleCalendarChange = async (calendarIntegrationId: string) => {
    console.log("Calendar change triggered:", calendarIntegrationId);
    console.log("Available calendar credentials:", calendarCredentials);

    if (calendarIntegrationId === "None") {
      // Clear calendar credentials and event types
      onChange({
        calendar: "None",
        calApiKey: "",
        calEventTypeId: "",
        calEventTypeSlug: "",
        calTimezone: "UTC"
      });
      setEventTypes([]);
      setEventTypesError(null);
      return;
    }

    // Find the selected calendar integration
    const selectedIntegration = calendarCredentials.find(cred => cred.id === calendarIntegrationId);
    console.log("Selected integration:", selectedIntegration);

    if (selectedIntegration) {
      // Populate calendar credentials from the integration
      const updateData = {
        calendar: calendarIntegrationId,
        calApiKey: selectedIntegration.api_key,
        calTimezone: selectedIntegration.timezone || "UTC",
        // Clear event type fields - they will be set when user selects an event type
        calEventTypeId: "",
        calEventTypeSlug: ""
      };
      console.log("Updating calendar data:", updateData);
      onChange(updateData);

      // Fetch event types for the selected calendar
      await fetchEventTypesForCalendar(calendarIntegrationId);
    }
  };

  const fetchEventTypesForCalendar = async (calendarCredentialId: string) => {
    try {
      setLoadingEventTypes(true);
      setEventTypesError(null);
      const eventTypes = await fetchEventTypesFromCalCom(calendarCredentialId);
      setEventTypes(eventTypes);
      console.log("Fetched event types:", eventTypes);
    } catch (error) {
      console.error('Failed to fetch event types:', error);
      setEventTypesError(error instanceof Error ? error.message : 'Failed to load event types');
      setEventTypes([]);
    } finally {
      setLoadingEventTypes(false);
    }
  };


  const handleEventTypeChange = (eventType: CalComEventType | null) => {
    if (eventType) {
      // Update calendar credentials with selected event type
      onChange({
        calEventTypeId: eventType.id.toString(),
        calEventTypeSlug: eventType.slug
      });
    } else {
      // Clear event type fields
      onChange({
        calEventTypeId: "",
        calEventTypeSlug: ""
      });
    }
  };


  // Fetch knowledge bases and calendar credentials on component mount
  useEffect(() => {
    const fetchKnowledgeBases = async () => {
      try {
        setLoadingKnowledgeBases(true);
        setKnowledgeBaseError(null);
        const response = await getKnowledgeBases();
        setKnowledgeBases(response.knowledgeBases || []);
      } catch (error) {
        console.error('Failed to fetch knowledge bases:', error);
        setKnowledgeBaseError(error instanceof Error ? error.message : 'Failed to load knowledge bases');
      } finally {
        setLoadingKnowledgeBases(false);
      }
    };

    const fetchCalendarCredentials = async () => {
      try {
        setLoadingCalendarCredentials(true);
        const credentials = await CalendarCredentialsService.getAllCredentials();
        console.log("Loaded calendar credentials:", credentials);
        setCalendarCredentials(credentials);
      } catch (error) {
        console.error('Failed to fetch calendar credentials:', error);
        toast({
          title: "Error",
          description: "Failed to load calendar integrations.",
          variant: "destructive",
        });
      } finally {
        setLoadingCalendarCredentials(false);
      }
    };


    fetchKnowledgeBases();
    fetchCalendarCredentials();
  }, [toast]);

  // Ensure provider, model, and default settings are always set correctly
  useEffect(() => {
    const updates: Partial<ModelData> = {};
    if (data.provider !== "OpenAI") {
      updates.provider = "OpenAI";
    }
    if (data.model !== "GPT-4.1") {
      updates.model = "GPT-4.1";
    }
    if (data.conversationStart !== "assistant-first") {
      updates.conversationStart = "assistant-first";
    }
    if (data.temperature !== 0.3) {
      updates.temperature = 0.3;
    }
    if (data.maxTokens !== 250) {
      updates.maxTokens = 250;
    }
    if (Object.keys(updates).length > 0) {
      onChange(updates);
    }
  }, [data.provider, data.model, data.conversationStart, data.temperature, data.maxTokens, onChange]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[540px]">
      {/* Left Column - Main Content */}
      <div className="lg:col-span-8 flex flex-col h-full">
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-[28px] font-light tracking-[0.2px] mb-2">Model Configuration</h2>
          <p className="text-base text-muted-foreground max-w-xl">
            Configure your assistant's core AI model and behavior settings
          </p>
        </div>

        {/* First Message Section */}
        <div className="mb-6">
          <label className="block text-base font-semibold tracking-[0.2px] mb-2">
            First Message (Call Greeting)
          </label>
          <p className="text-sm text-muted-foreground mb-2">
            This is the first message your assistant will say when a call starts
          </p>
          <Textarea
            placeholder="Hi! This is [Your Name] from [Your Company]. How may I help you today?"
            value={data.firstMessage}
            onChange={(e) => onChange({ firstMessage: e.target.value })}
            className="h-12 text-[15px] resize-none"
            rows={2}
          />
        </div>

        {/* System Prompt Section */}
        <div className="flex-1 flex flex-col">
          <label className="block text-base font-semibold tracking-[0.2px] mb-2">
            System Prompt
          </label>
          <Textarea
            placeholder="You are Helen, a professional dental receptionist. You should help patients schedule appointments, answer questions about services, and provide general information about the clinic..."
            value={data.systemPrompt}
            onChange={(e) => onChange({ systemPrompt: e.target.value })}
            className="flex-1 min-h-[220px] text-[15px] leading-relaxed resize-y"
            rows={12}
          />
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className="lg:col-span-4">
        <div className="bg-background/50 rounded-lg p-5 h-full">
          <h3 className="text-lg font-semibold tracking-tight mb-4">Model Settings</h3>

          <div className="space-y-4">
            {/* Knowledge Base */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="block text-sm font-medium">Knowledge Base</Label>
                {!loadingKnowledgeBases && (
                  <button
                    type="button"
                    onClick={() => {
                      const fetchKnowledgeBases = async () => {
                        try {
                          setLoadingKnowledgeBases(true);
                          setKnowledgeBaseError(null);
                          const response = await getKnowledgeBases();
                          setKnowledgeBases(response.knowledgeBases || []);
                        } catch (error) {
                          console.error('Failed to fetch knowledge bases:', error);
                          setKnowledgeBaseError(error instanceof Error ? error.message : 'Failed to load knowledge bases');
                        } finally {
                          setLoadingKnowledgeBases(false);
                        }
                      };
                      fetchKnowledgeBases();
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                  </button>
                )}
              </div>
              <Select
                value={data.knowledgeBase}
                onValueChange={(value) => onChange({ knowledgeBase: value })}
                disabled={loadingKnowledgeBases}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={loadingKnowledgeBases ? "Loading..." : "Select knowledge base"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="None">None</SelectItem>
                  {loadingKnowledgeBases ? (
                    <SelectItem value="loading" disabled>
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Loading knowledge bases...</span>
                      </div>
                    </SelectItem>
                  ) : knowledgeBaseError ? (
                    <SelectItem value="error" disabled>
                      <span className="text-destructive">Error loading knowledge bases</span>
                    </SelectItem>
                  ) : knowledgeBases.length === 0 ? (
                    <SelectItem value="no-kb" disabled>
                      <span className="text-muted-foreground">No knowledge bases found</span>
                    </SelectItem>
                  ) : (
                    knowledgeBases.map((kb) => (
                      <SelectItem key={kb.id} value={kb.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{kb.name}</span>
                          {kb.description && (
                            <span className="text-xs text-muted-foreground truncate max-w-[200px]">
                              {kb.description}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {knowledgeBaseError && (
                <p className="text-xs text-destructive mt-1">{knowledgeBaseError}</p>
              )}
              {!loadingKnowledgeBases && knowledgeBases.length === 0 && !knowledgeBaseError && (
                <p className="text-xs text-muted-foreground mt-2">
                  No knowledge bases found. Create one{" "}
                  <a
                    href="/knowledge-base"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline"
                  >
                    here
                  </a>
                </p>
              )}
            </div>

            {/* Calendar */}
            <div>
              <Label className="block text-sm font-medium mb-2">Calendar Integration</Label>
              <Select value={data.calendar || "None"} onValueChange={(value) => handleCalendarChange(value)}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="None">None</SelectItem>
                  {calendarCredentials.map((cred) => (
                    <SelectItem key={cred.id} value={cred.id}>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4" />
                        <span>{cred.label}</span>
                        {cred.is_active && (
                          <CheckCircle2 className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {loadingCalendarCredentials && (
                <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Loading calendar integrations...
                </div>
              )}
              {!loadingCalendarCredentials && calendarCredentials.length === 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Calendar not connected. Configure{" "}
                  <a
                    href="/settings"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:text-primary/80 underline"
                  >
                    here
                  </a>
                </p>
              )}
            </div>

            {/* Event Type Selection */}
            {data.calendar && data.calendar !== "None" && (
              <div>
                <Label className="block text-sm font-medium mb-2">Event Type</Label>
                <Select
                  value={data.calEventTypeId || "none"}
                  onValueChange={(value) => {
                    if (value === "none") {
                      handleEventTypeChange(null);
                    } else {
                      const selectedEventType = eventTypes.find(et => et.id.toString() === value);
                      handleEventTypeChange(selectedEventType || null);
                    }
                  }}
                  disabled={loadingEventTypes}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder={loadingEventTypes ? "Loading event types..." : "Select an event type"} />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="none">None</SelectItem>
                    {loadingEventTypes ? (
                      <SelectItem value="loading-event-types" disabled>
                        <div className="flex items-center space-x-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span>Loading event types...</span>
                        </div>
                      </SelectItem>
                    ) : eventTypesError ? (
                      <SelectItem value="event-types-error" disabled>
                        <span className="text-destructive">Error loading event types</span>
                      </SelectItem>
                    ) : eventTypes.length === 0 ? (
                      <SelectItem value="no-event-types" disabled>
                        <span className="text-muted-foreground">No event types found</span>
                      </SelectItem>
                    ) : (
                      eventTypes.map((eventType) => (
                        <SelectItem key={eventType.id} value={eventType.id.toString()}>
                          <div className="flex flex-col">
                            <span className="font-medium">{eventType.title}</span>
                            <span className="text-xs text-muted-foreground">
                              {eventType.slug} • {eventType.length} min
                            </span>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {eventTypesError && (
                  <p className="text-xs text-destructive mt-1">{eventTypesError}</p>
                )}
              </div>
            )}

            {/* Language */}
            <div>
              <Label className="block text-sm font-medium mb-2">Language</Label>
              <Select value={data.language} onValueChange={(value) => onChange({ language: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="en-es">English & Spanish</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="es">Spanish</SelectItem>
                  <SelectItem value="pt">Portuguese</SelectItem>
                  <SelectItem value="fr">French</SelectItem>
                  <SelectItem value="de">German</SelectItem>
                  <SelectItem value="nl">Dutch</SelectItem>
                  <SelectItem value="no">Norwegian</SelectItem>
                  <SelectItem value="ar">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
};