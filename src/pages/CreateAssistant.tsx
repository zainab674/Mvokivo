import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Sparkles, Trash2, Edit3, Settings, Mic, MessageSquare, BarChart3, Sliders, Webhook, CheckCircle2, Mail } from "lucide-react";
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
import { ThemeContainer } from "@/components/theme";
import DashboardLayout from "@/layout/DashboardLayout";
import { ModelTab } from "@/components/assistants/wizard/ModelTab";
import { VoiceTab } from "@/components/assistants/wizard/VoiceTab";
import { SMSTab } from "@/components/assistants/wizard/SMSTab";
import { AnalysisTab } from "@/components/assistants/wizard/AnalysisTab";
import { N8nTab } from "@/components/assistants/wizard/N8nTab";
import { EmailTab } from "@/components/assistants/wizard/EmailTab";
import { AssistantFormData } from "@/components/assistants/wizard/types";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { BACKEND_URL } from "@/lib/api-config";
import { FlowPreview } from "@/components/assistants/wizard/FlowPreview";
import { AdvancedTab } from "@/components/assistants/wizard/AdvancedTab";

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
  const [activeTab, setActiveTab] = useState("details");
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { user, getAccessToken } = useAuth();

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
  };

  const tabs = [
    { id: "details", label: "Agent Details", mobileLabel: "Details", icon: Settings },
    { id: "messaging", label: "Call Messaging Details", mobileLabel: "Messaging", icon: MessageSquare },
    { id: "context", label: "Agent Context", mobileLabel: "Context", icon: BarChart3 },
  ];

  const searchParams = new URLSearchParams(location.search);
  const providedName = searchParams.get('name');

  const [formData, setFormData] = useState<AssistantFormData>({
    name: providedName && providedName.trim() ? providedName : "Untitled Assistant",
    id: isEditing && id ? id : "asst_" + Math.random().toString(36).substr(2, 16),
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
      summaryTimeout: 30,
      evaluationTimeout: 15,
      structuredDataTimeout: 20,
      structuredDataPrompt: "",
      structuredDataProperties: {}
    },
    email: {
      subject: "",
      body: "",
      fromEmail: ""
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
    setFormData(prev => ({
      ...prev,
      [section]: { ...(prev[section] as object), ...data }
    }));
  };

  useEffect(() => {
    const loadExistingAssistant = async () => {
      if (!isEditing || !id) return;

      setIsLoading(true);
      try {
        const token = await getAccessToken();
        if (!token) throw new Error("Authentication required");

        const response = await fetch(`${BACKEND_URL}/api/v1/assistants/${id}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error(`Failed to load assistant`);

        const { data } = await response.json();
        if (data) {
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
              transcriber: { model: data.transcriber_model || "nova-2", language: data.transcriber_language || "en" },
              endCallMessage: data.end_call_message || "",
              maxCallDuration: data.max_call_duration || 30,
              idleMessages: Array.isArray(data.idle_messages) ? data.idle_messages.filter((item: any) => typeof item === 'string') : [],
              idleMessageMaxSpokenCount: data.max_idle_messages || 3,
              silenceTimeoutSeconds: data.silence_timeout || 10,
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
              businessHours: { enabled: false, start: "09:00", end: "17:00", timezone: "America/New_York" },
              messageTemplates: [],
              complianceSettings: { tcpaCompliant: true, optInEnabled: true, optOutKeywords: ["STOP", "UNSUBSCRIBE", "QUIT"], helpKeywords: ["HELP", "INFO", "SUPPORT"] },
              escalationRules: { enabled: true, humanTransferKeywords: ["AGENT", "HUMAN", "REPRESENTATIVE"], maxAutoResponses: 5 }
            },
            analysis: {
              structuredData: data.structured_data_fields || [],
              callSummary: data.analysis_summary_prompt || "",
              successEvaluation: true,
              customSuccessPrompt: data.analysis_evaluation_prompt || "",
              summaryTimeout: data.analysis_summary_timeout || 30,
              evaluationTimeout: data.analysis_evaluation_timeout || 15,
              structuredDataTimeout: data.analysis_structured_data_timeout || 20,
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
              endCallPhrPhrases: Array.isArray(data.end_call_phrases) ? data.end_call_phrases.filter((item: any) => typeof item === 'string') : [],
              maxCallDuration: data.max_call_duration || 30,
              idleMessages: Array.isArray(data.idle_messages) ? data.idle_messages.filter((item: any) => typeof item === 'string') : [],
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
            email: {
              subject: data.post_call_email_subject || "",
              body: data.post_call_email_body || "",
              fromEmail: data.post_call_email_from || ""
            },
            n8n: {
              webhookUrl: (data as any).n8n_webhook_url || "",
              webhookFields: Array.isArray((data as any).n8n_webhook_fields) ? (data as any).n8n_webhook_fields : []
            }
          });
        }
      } catch (error) {
        console.error('Error loading assistant:', error);
        toast({ title: 'Error', description: 'Failed to load assistant data.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    };
    void loadExistingAssistant();
  }, [isEditing, id, toast, getAccessToken]);

  const mapFormToAssistantPayload = async () => {
    return {
      name: formData.name,
      llm_provider_setting: formData.model.provider,
      llm_model_setting: formData.model.model,
      knowledge_base_id: formData.model.knowledgeBase !== "None" ? formData.model.knowledgeBase : null,
      temperature_setting: formData.model.temperature,
      max_token_setting: formData.model.maxTokens,
      language_setting: formData.model.language,
      first_message: formData.model.firstMessage || null,
      prompt: formData.model.systemPrompt || null,
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
      maximum_duration: formData.voice.maxDuration,
      smart_endpointing: String(formData.voice.smartEndpointing).toLowerCase() === "enabled",
      analysis_summary_prompt: formData.analysis.callSummary || null,
      analysis_evaluation_prompt: formData.analysis.customSuccessPrompt || null,
      analysis_summary_timeout: formData.analysis.summaryTimeout || null,
      analysis_evaluation_timeout: formData.analysis.evaluationTimeout || null,
      analysis_structured_data_prompt: formData.analysis.structuredDataPrompt || null,
      analysis_structured_data_properties: formData.analysis.structuredDataProperties || null,
      analysis_structured_data_timeout: formData.analysis.structuredDataTimeout || null,
      structured_data_fields: formData.analysis.structuredData?.length ? formData.analysis.structuredData : null,
      hipaa_compliance: formData.advanced.hipaaCompliant,
      audio_recording_setting: formData.advanced.recordingEnabled,
      video_recording: formData.advanced.videoRecordingEnabled,
      end_call_phrases: formData.advanced.endCallPhrases?.length ? formData.advanced.endCallPhrases : null,
      wait_seconds: formData.voice.waitSeconds,
      voicemail_detection_enabled: formData.advanced.voicemailDetectionEnabled || false,
      voicemail_message: formData.advanced.voicemailMessage || null,
      transfer_enabled: formData.advanced.transferEnabled || false,
      transfer_phone_number: formData.advanced.transferPhoneNumber || null,
      transfer_country_code: formData.advanced.transferCountryCode || "+1",
      transfer_sentence: formData.advanced.transferSentence || null,
      transfer_condition: formData.advanced.transferCondition || null,
      end_call_message: formData.model.endCallMessage || null,
      max_call_duration: formData.model.maxCallDuration || 30,
      idle_messages: formData.model.idleMessages?.length ? formData.model.idleMessages : null,
      max_idle_messages: formData.model.idleMessageMaxSpokenCount || 3,
      first_sms: formData.advanced.firstSms || null,
      sms_prompt: formData.advanced.smsPrompt || null,
      sms_calendar_booking_enabled: formData.sms.calendarBookingEnabled || false,
      whatsapp_number: formData.advanced.whatsappNumber || null,
      whatsapp_key: formData.advanced.whatsappKey || null,
      calendar: formData.model.calendar !== "None" ? formData.model.calendar : null,
      cal_api_key: formData.model.calApiKey || null,
      cal_event_type_id: formData.model.calEventTypeId || null,
      cal_event_type_slug: formData.model.calEventTypeSlug || null,
      cal_timezone: formData.model.calTimezone || null,
      post_call_email_subject: formData.email.subject || null,
      post_call_email_body: formData.email.body || null,
      post_call_email_from: formData.email.fromEmail || null,
      n8n_webhook_url: formData.n8n.webhookUrl || null,
      n8n_webhook_fields: formData.n8n.webhookFields?.length ? formData.n8n.webhookFields : null,
    };
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      if (!user?.id) throw new Error('You must be signed in.');
      const token = await getAccessToken();
      if (!token) throw new Error("Authentication required");
      const payload = await mapFormToAssistantPayload();

      const response = await fetch(isEditing ? `${BACKEND_URL}/api/v1/assistants/${id}` : `${BACKEND_URL}/api/v1/assistants`, {
        method: isEditing ? 'PUT' : 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Failed to save assistant`);
      toast({ title: isEditing ? 'Assistant updated' : 'Assistant created' });
      navigate('/assistants');
    } catch (e: any) {
      toast({ title: 'Save failed', description: e.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      if (!isEditing || !id) return;
      const token = await getAccessToken();
      const response = await fetch(`${BACKEND_URL}/api/v1/assistants/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        toast({ title: "Assistant deleted" });
        navigate("/assistants");
      }
    } catch (e) {
      toast({ title: "Error", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <ThemeContainer variant="base" className="min-h-screen no-hover-scaling p-0">
        <div className="flex flex-col h-screen overflow-hidden">
          {/* Header */}
          <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate("/assistants")}
                    className="text-muted-foreground hover:text-foreground h-10 w-10 shrink-0 rounded-full -ml-2"
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <div className="flex-1 min-w-0 pt-0.5">
                    <div className="flex items-center gap-2 mb-1.5">
                      {isEditing ? <Edit3 className="h-4 w-4 text-primary/60 shrink-0" /> : <Sparkles className="h-4 w-4 text-primary/60 shrink-0" />}
                      <span className="text-xs font-semibold text-primary/60 uppercase tracking-wider">Assistant</span>
                    </div>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      className="border-0 bg-transparent text-xl sm:text-2xl font-bold px-0 h-auto focus-visible:ring-0 truncate p-0 placeholder:text-muted-foreground/50"
                      placeholder="My Assistant"
                      disabled={isLoading}
                    />
                    <div className="mt-2 flex items-center">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted/40 text-[10px] font-mono text-muted-foreground border border-border/20">
                        <span className="opacity-50">ID:</span>
                        <span className="select-all">{formData.id}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="bg-background border-b border-border/40 overflow-x-auto custom-scrollbar no-scrollbar">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6">
              <div className="flex items-center gap-2 sm:gap-8 h-12">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabClick(tab.id)}
                    className={cn(
                      "h-full px-3 sm:px-2 text-xs sm:text-sm font-medium transition-all relative flex items-center gap-1.5 sm:gap-2 whitespace-nowrap",
                      activeTab === tab.id ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <tab.icon className="h-3.5 w-3.5 shrink-0" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.mobileLabel}</span>
                    {activeTab === tab.id && <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-1 overflow-hidden bg-[#fbfcfd] dark:bg-zinc-950/40">
            <div className="flex-1 flex flex-col min-w-0 border-r border-border/40">
              <div className="flex-1 overflow-y-auto p-0 sm:p-8">
                {isLoading ? (
                  <div className="flex items-center justify-center py-24">
                    <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-primary" />
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
                      className="max-w-4xl mx-auto space-y-6 sm:space-y-8"
                    >
                      {activeTab === "details" && (
                        <div className="space-y-6 sm:space-y-8">
                          <ModelTab data={formData.model} onChange={(data) => handleFormDataChange('model', data)} />
                          <VoiceTab data={formData.voice} onChange={(data) => handleFormDataChange('voice', data)} />
                        </div>
                      )}
                      {activeTab === "messaging" && (
                        <div className="space-y-6 sm:space-y-8">
                          <SMSTab data={formData.sms} onChange={(data) => handleFormDataChange('sms', data)} />
                          <EmailTab data={formData.email} assistantName={formData.name} onChange={(data) => handleFormDataChange('email', data)} />
                        </div>
                      )}
                      {activeTab === "context" && (
                        <div className="space-y-6 sm:space-y-8">
                          <AnalysisTab data={formData.analysis} onChange={(data) => handleFormDataChange('analysis', data)} />
                          <AdvancedTab data={formData.advanced} onChange={(data) => handleFormDataChange('advanced', data)} />
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                )}
              </div>


              {/* Footer Actions */}
              <div className="border-t border-border/40 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-sm p-4 px-4 sm:px-8">
                <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate("/assistants")}
                      disabled={isSaving || isLoading}
                      className="h-9 text-xs sm:text-sm flex-1 sm:flex-none"
                    >
                      Previous
                    </Button>
                    {isEditing && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-9 text-xs sm:text-sm text-destructive hover:bg-destructive/10 flex-1 sm:flex-none">
                            <Trash2 className="h-4 w-4 mr-1.5 sm:mr-2" />Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="w-[90vw] max-w-lg">
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Assistant</AlertDialogTitle>
                            <AlertDialogDescription>This action cannot be undone. This assistant and its configuration will be permanently removed.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-white hover:bg-destructive/90">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                    <Button
                      variant="secondary"
                      onClick={handleSave}
                      disabled={isSaving || isLoading}
                      className="h-9 sm:h-10 text-xs sm:text-sm bg-emerald-500/10 text-emerald-600 border-emerald-500/20 flex-1 sm:flex-none"
                    >
                      Draft
                    </Button>
                    <Button
                      onClick={handleSave}
                      disabled={isSaving || isLoading}
                      className="h-9 sm:h-10 text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-600 text-white min-w-[100px] sm:min-w-[140px] flex-1 sm:flex-none"
                    >
                      {isSaving ? "Saving..." : (isEditing ? "Update" : "Activate")}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            {/* Preview Sidebar (Desktop Only) */}
            <div className="hidden lg:flex w-[400px] xl:w-[500px] bg-white dark:bg-zinc-900/10 flex-col overflow-hidden">
              <div className="flex-1 overflow-y-auto p-6 xl:p-8"><FlowPreview formData={formData} /></div>
            </div>
          </div>
        </div>
      </ThemeContainer>
    </DashboardLayout>
  );
};

export default CreateAssistant;
