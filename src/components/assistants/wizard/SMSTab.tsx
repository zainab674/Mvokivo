import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, MessageSquare, Clock, Shield, Calendar, Database, Loader2 } from "lucide-react";
import { SMSData } from "./types";
import { WizardSlider } from "./WizardSlider";
import { getKnowledgeBases } from "@/lib/api/knowledgeBase";
import { CalendarCredentialsService, type UserCalendarCredentials } from "@/lib/calendar-credentials";
import { useToast } from "@/hooks/use-toast";

interface SMSTabProps {
  data: SMSData;
  onChange: (data: Partial<SMSData>) => void;
}

export const SMSTab: React.FC<SMSTabProps> = ({ data, onChange }) => {
  const [isComplianceOpen, setIsComplianceOpen] = React.useState(false);

  // Knowledge Base state
  const [knowledgeBases, setKnowledgeBases] = useState<any[]>([]);
  const [loadingKnowledgeBases, setLoadingKnowledgeBases] = useState(false);
  const [knowledgeBaseError, setKnowledgeBaseError] = useState<string | null>(null);

  // Calendar state
  const [calendarCredentials, setCalendarCredentials] = useState<UserCalendarCredentials[]>([]);
  const [loadingCalendarCredentials, setLoadingCalendarCredentials] = useState(false);

  const { toast } = useToast();

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

  return (
    <div className=" min-h-[540px]">
      {/* Left Column - Main Content */}
      <div className="lg:col-span-8 flex flex-col">
        <div className="flex-1 space-y-6">
          {/* Header Section */}
          <div className="mb-6">
            <h2 className="text-[28px] font-light tracking-[0.2px] mb-2">Messages</h2>
            <p className="text-base text-muted-foreground max-w-xl">
              Configure your messaging assistant for SMS, WhatsApp, and other platforms
            </p>
          </div>

          {/* First Message Section */}
          <div className="mb-6">
            <label className="block text-base font-medium tracking-[0.2px] mb-2">
              First Message
            </label>
            <Textarea
              placeholder="Hello! I'm your AI assistant. How can I help you today?"
              value={data.firstMessage}
              onChange={(e) => onChange({ firstMessage: e.target.value })}
              className="min-h-[80px] text-[15px] leading-relaxed resize-y"
              rows={3}
            />
            <p className="text-sm text-muted-foreground mt-2">
              This message will be sent automatically when an SMS conversation starts
            </p>
          </div>

          {/* Messaging Instructions Section */}
          <div className="flex-1">
            <label className="block text-base font-medium tracking-[0.2px] mb-2">
              Messaging Instructions
            </label>
            <Textarea
              placeholder="You are a messaging assistant for a dental clinic. Keep responses concise and helpful. Always ask for confirmation before booking appointments via text..."
              value={data.systemPrompt}
              onChange={(e) => onChange({ systemPrompt: e.target.value })}
              className="min-h-[420px] h-full text-[15px] leading-relaxed resize-y"
              rows={16}
            />
          </div>
        </div>
      </div>

      {/* Right Column - Sidebar */}
      <div className="lg:col-span-4">
        <div className="bg-background/50 rounded-lg p-5 h-full">
          <h3 className="text-lg font-medium tracking-tight mb-4">Messaging Settings</h3>

          <div className="space-y-4">

            {/* Knowledge Base */}
            <div>
              <Label className="block text-sm font-medium mb-2">Knowledge Base</Label>
              <Select value={data.knowledgeBase} onValueChange={(value) => onChange({ knowledgeBase: value })}>
                <SelectTrigger className="h-10">
                  <SelectValue placeholder={loadingKnowledgeBases ? "Loading..." : "Select knowledge base"} />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  <SelectItem value="None">None</SelectItem>
                  {loadingKnowledgeBases ? (
                    <div className="flex items-center justify-center p-2">
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      <span>Loading knowledge bases...</span>
                    </div>
                  ) : knowledgeBaseError ? (
                    <div className="flex items-center justify-center p-2 text-destructive">
                      <span className="text-destructive">Error loading knowledge bases</span>
                    </div>
                  ) : knowledgeBases.length === 0 ? (
                    <div className="flex items-center justify-center p-2">
                      <span className="text-muted-foreground">No knowledge bases found</span>
                    </div>
                  ) : (
                    knowledgeBases.map((kb) => (
                      <SelectItem key={kb.id} value={kb.id}>
                        <div className="flex items-center">
                          <Database className="w-4 h-4 mr-2" />
                          {kb.name}
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {knowledgeBases.length === 0 && !loadingKnowledgeBases && (
                <p className="text-xs text-muted-foreground mt-1">
                  No knowledge bases found. Create one{" "}
                  <a href="/knowledge-base" className="text-primary hover:underline">
                    here
                  </a>
                </p>
              )}
            </div>



            {/* Character Limit */}





          </div>
        </div>
      </div>


    </div>
  );
};

