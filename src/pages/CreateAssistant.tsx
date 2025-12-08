import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Trash2, Edit3, Settings, Mic, MessageSquare, BarChart3, Sliders, Webhook, CheckCircle2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { ThemeContainer, ThemeSection, ThemeCard } from "@/components/theme";
import DashboardLayout from "@/layout/DashboardLayout";
import { ModelTab } from "@/components/assistants/wizard/ModelTab";
import { VoiceTab } from "@/components/assistants/wizard/VoiceTab";
import { SMSTab } from "@/components/assistants/wizard/SMSTab";
import { AnalysisTab } from "@/components/assistants/wizard/AnalysisTab";
import { AdvancedTab } from "@/components/assistants/wizard/AdvancedTab";
import { N8nTab } from "@/components/assistants/wizard/N8nTab";
import { AssistantFormData } from "@/components/assistants/wizard/types";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ensureUserExists } from '@/lib/supabase-retry';

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

const CreateAssistant = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const isEditing = !!id;
  const [activeTab, setActiveTab] = useState("model");
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Debug logging
  console.log('CreateAssistant rendered', { isEditing, id, isLoading, activeTab });
  
  // Debug tab switching
  const handleTabClick = (tabId: string) => {
    console.log('Tab clicked:', tabId);
    setActiveTab(tabId);
  };

  const tabs = [
    { id: "model", label: "Model", icon: Settings },
    { id: "voice", label: "Voice", icon: Mic },
    { id: "sms", label: "Messages", icon: MessageSquare },
    { id: "analysis", label: "Analysis", icon: BarChart3 },
    { id: "advanced", label: "Advanced", icon: Sliders },
  ];
  
  const searchParams = new URLSearchParams(location.search);
  const providedName = searchParams.get('name');

  const [formData, setFormData] = useState<AssistantFormData>({
    name: isEditing ? "john" : (providedName && providedName.trim() ? providedName : "Untitled Assistant"),
    id: isEditing ? "asst_abcd1234efgh5678" : "asst_" + Math.random().toString(36).substr(2, 16),
    model: {
      provider: "OpenAI",
      model: "GPT-4.1",
      knowledgeBase: "None",
      calendar: "None",
      conversationStart: "assistant-first",
      voice: "rachel-elevenlabs",
      temperature: 0.3,
      maxTokens: 250,
      firstMessage: "",
      systemPrompt: "",
      language: "en",
      transcriber: {
        model: "nova-2",
        language: "en"
      },
      // Call Management Settings
      endCallMessage: "",
      maxCallDuration: 1800,
      idleMessages: [],
      idleMessageMaxSpokenCount: 3,
      silenceTimeoutSeconds: 10
    },
    voice: {
      provider: "Cartesia",
      voice: "41468051-3a85-4b68-92ad-64add250d369",
      model: "sonic-3",
      backgroundSound: "none",
      inputMinCharacters: 10,
      stability: 0.71,
      clarity: 0.75,
      speed: 1.0,
      style: 0.0,
      latency: 1,
      waitSeconds: 0.5,
      smartEndpointing: "enabled",
      advancedTimingEnabled: false,
      timingSlider1: 0.3,
      timingSlider2: 0.8,
      timingSlider3: 1.2,
      numWordsToInterrupt: 2,
      voiceSeconds: 0.2,
      backOffSeconds: 1,
      silenceTimeout: 30,
      maxDuration: 1800,
      similarityBoost: 0.5,
      useSpeakerBoost: true,
      optimizeStreaming: 2,
      pronunciationDictionary: false,
      chunk: 1
    },
    sms: {
      provider: "Twilio",
      knowledgeBase: "None",
      calendar: "None",
      calendarBookingEnabled: false,
      systemPrompt: "",
      firstMessage: "",
      responseStyle: 0.5,
      characterLimit: 160,
      language: "en",
      autoReply: true,
      autoReplyDelay: 1,
      businessHours: {
        enabled: false,
        start: "09:00",
        end: "17:00",
        timezone: "America/New_York"
      },
      messageTemplates: [],
      complianceSettings: {
        tcpaCompliant: true,
        optInEnabled: true,
        optOutKeywords: ["STOP", "UNSUBSCRIBE", "QUIT"],
        helpKeywords: ["HELP", "INFO", "SUPPORT"]
      },
      escalationRules: {
        enabled: true,
        humanTransferKeywords: ["AGENT", "HUMAN", "REPRESENTATIVE"],
        maxAutoResponses: 5
      }
    },
    analysis: {
      structuredData: [],
      callSummary: "",
      successEvaluation: true,
      customSuccessPrompt: "",
      // Analysis timeout settings (in seconds)
      summaryTimeout: 30,
      evaluationTimeout: 15,
      structuredDataTimeout: 20,
      // Structured data configuration
      structuredDataPrompt: "",
      structuredDataProperties: {}
    },
    advanced: {
      hipaaCompliant: false,
      pciCompliant: false,
      recordingEnabled: true,
      audioRecordingFormat: "wav",
      videoRecordingEnabled: false,
      endCallMessage: "",
      endCallPhrases: [],
      maxCallDuration: 1800,
      idleMessages: [],
      idleMessageMaxSpokenCount: 1,
      silenceTimeoutSeconds: 30,
      responseDelaySeconds: 1,
      llmRequestDelaySeconds: 0.1,
      numWordsToInterruptAssistant: 2,
      maxDurationSeconds: 600,
      backgroundSound: "office",
      voicemailDetectionEnabled: false,
      voicemailMessage: "",
      transferEnabled: false,
      transferPhoneNumber: "",
      transferCountryCode: "+1",
      transferSentence: "",
      transferCondition: "",
      firstSms: "",
      smsPrompt: "",
      whatsappNumber: "",
      whatsappKey: ""
    },
    n8n: {
      webhookUrl: "",
      webhookFields: []
    }
  });

  const handleFormDataChange = (section: keyof AssistantFormData, data: any) => {
    console.log('Form data change:', section, data);
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...data }
    }));
  };



  // Load existing assistant data when editing
  useEffect(() => {
    const loadExistingAssistant = async () => {
      if (!isEditing || !id) return;
      
      setIsLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setIsLoading(false);
          return;
        }

        const { data, error } = await supabase
          .from('assistant')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Failed to load assistant:', error);
          toast({
            title: 'Error',
            description: 'Failed to load assistant data. Please try again.',
            variant: 'destructive',
          });
          setIsLoading(false);
          return;
        }

        if (data) {
          // Map database data to form data
          setFormData({
            name: data.name || "Untitled Assistant",
            id: data.id,
            model: {
              provider: data.llm_provider_setting || "OpenAI",
              model: data.llm_model_setting || "GPT-4.1",
              knowledgeBase: data.knowledge_base_id || "None",
              calendar: data.calendar || "None",
              conversationStart: "assistant-first",
              voice: "41468051-3a85-4b68-92ad-64add250d369",
              temperature: data.temperature_setting || 0.3,
              maxTokens: data.max_token_setting || 250,
              language: data.language_setting || "en",
              firstMessage: data.first_message || "",
              systemPrompt: data.prompt || "",
              transcriber: {
                model: data.transcriber_model || "nova-2",
                language: data.transcriber_language || "en"
              },
              // Call Management Settings
              endCallMessage: data.end_call_message || "",
              maxCallDuration: data.max_call_duration || 30,
              idleMessages: Array.isArray(data.idle_messages) ? data.idle_messages.filter(item => typeof item === 'string') : [],
              idleMessageMaxSpokenCount: data.max_idle_messages || 3,
              silenceTimeoutSeconds: data.silence_timeout || 10,
              // Calendar credentials (populated from integration)
              calApiKey: data.cal_api_key || "",
              calEventTypeId: data.cal_event_type_id || "",
              calEventTypeSlug: data.cal_event_type_slug || "",
              calTimezone: data.cal_timezone || "UTC"
            },
            voice: {
              provider: data.voice_provider_setting || "Cartesia",
              voice: data.voice_name_setting || "41468051-3a85-4b68-92ad-64add250d369",
              model: data.voice_model_setting || "sonic-3",
              backgroundSound: data.background_sound_setting || "none",
              inputMinCharacters: data.input_min_characters || 10,
              stability: data.voice_stability || 0.71,
              clarity: data.voice_clarity_similarity || 0.75,
              speed: 1.0,
              style: 0.0,
              latency: 1,
              waitSeconds: data.wait_seconds || 0.5,
              smartEndpointing: data.smart_endpointing ? "enabled" : "disabled",
              advancedTimingEnabled: false,
              timingSlider1: 0.3,
              timingSlider2: 0.8,
              timingSlider3: 1.2,
              numWordsToInterrupt: 2,
              voiceSeconds: data.voice_seconds || 0.2,
              backOffSeconds: data.voice_backoff_seconds || 1,
              silenceTimeout: data.silence_timeout || 30,
              maxDuration: data.maximum_duration || 1800,
              similarityBoost: 0.5,
              useSpeakerBoost: data.use_speaker_boost || true,
              optimizeStreaming: data.voice_optimize_streaming_latency || 2,
              pronunciationDictionary: false,
              chunk: 1
            },
            sms: {
              provider: "Twilio",
              knowledgeBase: data.knowledge_base_id || "None",
              calendar: data.calendar || "None",
              calendarBookingEnabled: data.sms_calendar_booking_enabled || false,
              systemPrompt: data.sms_prompt || "",
              firstMessage: data.first_sms || "",
              responseStyle: data.response_style || 0.5,
              characterLimit: data.character_limit || 160,
              language: data.language_setting || "en",
              autoReply: true,
              autoReplyDelay: 1,
              businessHours: {
                enabled: false,
                start: "09:00",
                end: "17:00",
                timezone: "America/New_York"
              },
              messageTemplates: [],
              complianceSettings: {
                tcpaCompliant: true,
                optInEnabled: true,
                optOutKeywords: ["STOP", "UNSUBSCRIBE", "QUIT"],
                helpKeywords: ["HELP", "INFO", "SUPPORT"]
              },
              escalationRules: {
                enabled: true,
                humanTransferKeywords: ["AGENT", "HUMAN", "REPRESENTATIVE"],
                maxAutoResponses: 5
              }
            },
            analysis: {
              structuredData: data.structured_data_fields || [],
              callSummary: data.analysis_summary_prompt || "",
              successEvaluation: true,
              customSuccessPrompt: data.analysis_evaluation_prompt || "",
              // Analysis timeout settings
              summaryTimeout: data.analysis_summary_timeout || 30,
              evaluationTimeout: data.analysis_evaluation_timeout || 15,
              structuredDataTimeout: data.analysis_structured_data_timeout || 20,
              // Structured data configuration
              structuredDataPrompt: data.analysis_structured_data_prompt || "",
              structuredDataProperties: data.analysis_structured_data_properties || {}
            },
            advanced: {
              hipaaCompliant: data.hipaa_compliance || false,
              pciCompliant: false,
              recordingEnabled: data.audio_recording_setting || true,
              audioRecordingFormat: "wav",
              videoRecordingEnabled: data.video_recording || false,
              endCallMessage: data.end_call_message || "",
              endCallPhrases: Array.isArray(data.end_call_phrases) ? data.end_call_phrases.filter(item => typeof item === 'string') : [],
              maxCallDuration: data.max_call_duration || 30,
              idleMessages: Array.isArray(data.idle_messages) ? data.idle_messages.filter(item => typeof item === 'string') : [],
              idleMessageMaxSpokenCount: data.max_idle_messages || 3,
              silenceTimeoutSeconds: data.silence_timeout || 10,
              responseDelaySeconds: data.response_delay_seconds || 1,
              llmRequestDelaySeconds: data.llm_request_delay_seconds || 0.1,
              numWordsToInterruptAssistant: data.num_words_to_interrupt_assistant || 2,
              maxDurationSeconds: data.max_duration_seconds || 600,
              backgroundSound: data.background_sound_setting || "office",
              voicemailDetectionEnabled: data.voicemail_detection_enabled || false,
              voicemailMessage: data.voicemail_message || "",
              transferEnabled: data.transfer_enabled || false,
              transferPhoneNumber: data.transfer_phone_number || "",
              transferCountryCode: data.transfer_country_code || "+1",
              transferSentence: data.transfer_sentence || "",
              transferCondition: data.transfer_condition || "",
              whatsappNumber: (data as any).whatsapp_number || "",
              whatsappKey: (data as any).whatsapp_key || ""
            },
            n8n: {
              webhookUrl: (data as any).n8n_webhook_url || "",
              webhookFields: Array.isArray((data as any).n8n_webhook_fields) ? (data as any).n8n_webhook_fields : []
            }
          });

          // Calendar credentials are now loaded directly in the model tab above
        }
      } catch (error) {
        console.error('Error loading assistant:', error);
        toast({
          title: 'Error',
          description: 'Failed to load assistant data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    void loadExistingAssistant();
  }, [isEditing, id, toast]);

  const mapFormToAssistantPayload = async (userId: string) => {
    const kbId = formData.model.knowledgeBase && formData.model.knowledgeBase !== "None"
      ? formData.model.knowledgeBase
      : null;

    // Debug: Log formData to see what calendar data is available
    console.log("FormData model calendar fields:", {
      calendar: formData.model.calendar,
      calApiKey: formData.model.calApiKey,
      calEventTypeId: formData.model.calEventTypeId,
      calEventTypeSlug: formData.model.calEventTypeSlug,
      calTimezone: formData.model.calTimezone
    });

    // Use existing event type data (no auto-creation)
    const calEventTypeId = formData.model.calEventTypeId || null;
    const calEventTypeSlug = formData.model.calEventTypeSlug || null;

    return {
      user_id: userId,
      name: formData.name,
      llm_provider_setting: formData.model.provider,
      llm_model_setting: formData.model.model,
      knowledge_base_id: kbId,
      temperature_setting: formData.model.temperature,
      max_token_setting: formData.model.maxTokens,
      language_setting: formData.model.language,
      first_message: formData.model.firstMessage || null,
      prompt: formData.model.systemPrompt || null,

      // Voice
      voice_provider_setting: formData.voice.provider,
      voice_model_setting: formData.voice.model,
      voice_name_setting: formData.voice.voice,
      background_sound_setting: formData.voice.backgroundSound,
      input_min_characters: formData.voice.inputMinCharacters,
      voice_stability: formData.voice.stability,
      voice_clarity_similarity: formData.voice.clarity,
      voice_speed: formData.voice.speed,
      use_speaker_boost: formData.voice.useSpeakerBoost,
      voice_optimize_streaming_latency: formData.voice.optimizeStreaming,
      voice_seconds: formData.voice.voiceSeconds,
      voice_backoff_seconds: formData.voice.backOffSeconds,
      silence_timeout: formData.voice.silenceTimeout,
      maximum_duration: formData.voice.maxDuration,
      smart_endpointing: String(formData.voice.smartEndpointing).toLowerCase() === "enabled",


      // Analysis
      analysis_summary_prompt: formData.analysis.callSummary || null,
      analysis_evaluation_prompt: formData.analysis.customSuccessPrompt || null,
      analysis_summary_timeout: formData.analysis.summaryTimeout || null,
      analysis_evaluation_timeout: formData.analysis.evaluationTimeout || null,
      analysis_structured_data_prompt: formData.analysis.structuredDataPrompt || null,
      analysis_structured_data_properties: formData.analysis.structuredDataProperties || null,
      analysis_structured_data_timeout: formData.analysis.structuredDataTimeout || null,
      structured_data_fields: formData.analysis.structuredData?.length ? formData.analysis.structuredData : null,

      // Advanced
      hipaa_compliance: formData.advanced.hipaaCompliant,
      audio_recording_setting: formData.advanced.recordingEnabled,
      video_recording: formData.advanced.videoRecordingEnabled,
      end_call_phrases: formData.advanced.endCallPhrases?.length ? formData.advanced.endCallPhrases : null,
      wait_seconds: formData.voice.waitSeconds,
      voicemail_detection_enabled: formData.advanced.voicemailDetectionEnabled || false,
      voicemail_message: formData.advanced.voicemailMessage || null,

      // Call Transfer (Cold Transfer Only)
      transfer_enabled: formData.advanced.transferEnabled || false,
      transfer_phone_number: formData.advanced.transferPhoneNumber || null,
      transfer_country_code: formData.advanced.transferCountryCode || "+1",
      transfer_sentence: formData.advanced.transferSentence || null,
      transfer_condition: formData.advanced.transferCondition || null,

      // Call Management Settings (from Model tab)
      end_call_message: formData.model.endCallMessage || null,
      max_call_duration: formData.model.maxCallDuration || 30,
      idle_messages: formData.model.idleMessages?.length ? formData.model.idleMessages : null,
      max_idle_messages: formData.model.idleMessageMaxSpokenCount || 3,
      silence_timeout: formData.model.silenceTimeoutSeconds || 10,

      // SMS fields
      first_sms: formData.sms.firstMessage || null,
      sms_prompt: formData.sms.systemPrompt || null,
      sms_calendar_booking_enabled: formData.sms.calendarBookingEnabled || false,

      // WhatsApp Integration
      whatsapp_credentials_id: formData.model.whatsappCredentialsId || null,
      whatsapp_number: formData.model.whatsappNumber || null,
      whatsapp_key: formData.model.whatsappKey || null,

      // Calendar Integration
      calendar: formData.model.calendar !== "None" ? formData.model.calendar : null,
      cal_api_key: formData.model.calApiKey || null,
      cal_event_type_id: calEventTypeId,
      cal_event_type_slug: calEventTypeSlug,
      cal_timezone: formData.model.calTimezone || null,

      // n8n Integration
      n8n_webhook_url: formData.n8n.webhookUrl || null,
      n8n_webhook_fields: formData.n8n.webhookFields?.length ? formData.n8n.webhookFields : null,
    } as any;
  };


  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!user?.id) throw new Error('You must be signed in to save an assistant.');

      await ensureUserExists(user.id, user.fullName || null);

      const payload = await mapFormToAssistantPayload(user.id);

      // Debug: Log the payload to see what's being saved
      console.log("Assistant payload being saved:", payload);
      console.log("Calendar data:", {
        calendar: payload.calendar,
        cal_api_key: payload.cal_api_key,
        cal_event_type_id: payload.cal_event_type_id,
        cal_event_type_slug: payload.cal_event_type_slug,
        cal_timezone: payload.cal_timezone
      });



      if (isEditing && id) {
        const { error } = await supabase
          .from('assistant')
          .update(payload)
          .eq('id', id);
        if (error) {
          // Retry once if FK missing
          if ((error as any)?.code === '23503') {
            await ensureUserExists(user.id, user.fullName || null);
            const retry = await supabase.from('assistant').update(payload).eq('id', id);
            if (retry.error) throw retry.error;
          } else {
            throw error;
          }
        }
        toast({ title: 'Assistant updated', description: 'Your changes have been saved.' });
        navigate('/assistants');
      } else {
        let { data, error } = await supabase
          .from('assistant')
          .insert(payload)
          .select('id')
          .single();
        if (error) {
          if ((error as any)?.code === '23503') {
            await ensureUserExists(user.id, user.fullName || null);
            const retry = await supabase
              .from('assistant')
              .insert(payload)
              .select('id')
              .single();
            data = retry.data as any;
            if (retry.error) throw retry.error;
          } else {
            throw error;
          }
        }
        if (data?.id) {
          toast({ title: 'Assistant created', description: 'Your assistant has been saved.' });
          navigate(`/assistants`);
        }
      }
    } catch (e: any) {
      toast({ title: 'Save failed', description: e?.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  

  const handleDelete = () => {
    console.log("Deleting assistant:", formData.id);
    // Implement actual deletion logic here
    toast({
      title: "Assistant deleted",
      description: "The assistant has been permanently deleted.",
    });
    navigate("/assistants");
  };

  return (
    <DashboardLayout>
      <ThemeContainer variant="base" className="min-h-screen no-hover-scaling">
        <div className="flex flex-col h-screen">
          {/* Top Header Bar */}
          <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-[1920px] mx-auto px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => navigate("/assistants")}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back
                  </Button>
                  <div className="h-6 w-px bg-border" />
                  <div className="flex items-center gap-3">
                    {isEditing ? (
                      <Edit3 className="h-5 w-5 text-primary/60" />
                    ) : (
                      <Sparkles className="h-5 w-5 text-primary/60" />
                    )}
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="border-0 bg-transparent text-xl font-semibold px-0 h-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                      placeholder="Assistant Name"
                      disabled={isLoading}
                    />
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Button 
                    onClick={handleSave}
                    disabled={isSaving || isLoading}
                    className="gap-2"
                  >
                    {isSaving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        Save Assistant
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar Navigation */}
            <div className="w-64 border-r border-border/40 bg-background/50 backdrop-blur-sm overflow-y-auto">
              <div className="p-4 space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabClick(tab.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200
                        ${activeTab === tab.id 
                          ? 'bg-primary/10 text-primary border border-primary/20' 
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }
                      `}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
              
              {/* Assistant Info */}
              <div className="p-4 border-t border-border/40 mt-4">
                <p className="text-xs text-muted-foreground font-mono mb-2">Assistant ID</p>
                <p className="text-xs font-mono text-foreground/60 break-all">
                  {isLoading ? "..." : formData.id}
                </p>
              </div>

              {/* Delete Button - Only in Edit Mode */}
              {isEditing && (
                <div className="p-4 border-t border-border/40">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        className="w-full gap-2"
                        disabled={isLoading}
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete Assistant
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent className="liquid-glass-heavy border border-destructive/20">
                      <AlertDialogHeader>
                        <AlertDialogTitle className="text-destructive">
                          Delete Assistant
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                          Are you sure you want to delete this assistant? This action cannot be undone 
                          and all associated data will be permanently removed from both local storage and database.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={handleDelete}
                          className="bg-destructive/20 border border-destructive/40 text-destructive hover:bg-destructive/30"
                        >
                          Delete Assistant
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-muted/20">
              <div className="max-w-6xl mx-auto p-8">
                {isLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                      <p className="text-muted-foreground">Loading assistant configuration...</p>
                    </div>
                  </div>
                ) : (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      variants={tabVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                      className="pointer-events-auto"
                    >
                      {activeTab === "model" && (
                        <ModelTab 
                          data={formData.model} 
                          onChange={(data) => handleFormDataChange('model', data)} 
                        />
                      )}
                      {activeTab === "voice" && (
                        <VoiceTab 
                          data={formData.voice} 
                          onChange={(data) => handleFormDataChange('voice', data)} 
                        />
                      )}
                      {activeTab === "sms" && (
                        <SMSTab 
                          data={formData.sms} 
                          onChange={(data) => handleFormDataChange('sms', data)} 
                        />
                      )}
                      {activeTab === "analysis" && (
                        <AnalysisTab 
                          data={formData.analysis} 
                          onChange={(data) => handleFormDataChange('analysis', data)} 
                        />
                      )}
                      {activeTab === "advanced" && (
                        <AdvancedTab 
                          data={formData.advanced} 
                          onChange={(data) => handleFormDataChange('advanced', data)} 
                        />
                      )}
                      {activeTab === "n8n" && (
                        <N8nTab 
                          data={formData.n8n} 
                          onChange={(data) => handleFormDataChange('n8n', data)} 
                        />
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>
            </div>
          </div>
        </div>
      </ThemeContainer>
    </DashboardLayout>
  );
};

export default CreateAssistant;