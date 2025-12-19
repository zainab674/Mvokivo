import React, { useState, useEffect, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Building2, Database, Users, Zap, Phone, MessageSquare,
  Calendar, CheckCircle2, Plus, Mail, Search, Check, Info
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { TwilioIntegrationCard } from "./integrations/TwilioIntegrationCard";
import { SecurityCard } from "./integrations/SecurityCard";
import { TwilioAuthDialog } from "./TwilioAuthDialog";
import { CalendarIntegrationCard } from "./CalendarIntegrationCard";
import { CalendarAuthDialog } from "./CalendarAuthDialog";
import type { TwilioIntegration, TwilioCredentials } from "./integrations/types";
import { TwilioCredentialsService, type UserTwilioCredentials } from "@/lib/twilio-credentials";
import { CalendarCredentialsService, type UserCalendarCredentials, type CalendarCredentialsInput } from "@/lib/calendar-credentials";
import { WhatsAppIntegrationCard } from "./WhatsAppIntegrationCard";
import { WhatsAppCredentialsService, type UserWhatsAppCredentials } from "@/lib/whatsapp-credentials";
import { EmailIntegrationCard } from "./EmailIntegrationCard";
import { EmailAuthDialog } from "./EmailAuthDialog";
import { EmailManagementDialog } from "./EmailManagementDialog";
import { TwilioManagementDialog } from "./TwilioManagementDialog";
import { CalendarManagementDialog } from "./CalendarManagementDialog";
import { WhatsAppManagementDialog } from "./WhatsAppManagementDialog";

const integrationsData = [
  {
    id: "twilio",
    name: "Twilio",
    description: "Cloud communications platform for voice, SMS, and video",
    icon: Phone,
    status: "available",
    category: "Messaging & Support",
    brandColor: "#f22f46"
  },
  {
    id: "calcom",
    name: "Cal.com",
    description: "Open-source scheduling infrastructure for everyone",
    icon: Calendar,
    status: "available",
    category: "Project & Workflow",
    brandColor: "#292929"
  },
  {
    id: "email",
    name: "Email (SMTP/IMAP)",
    description: "Connect your email for AI assistant replies and campaigns",
    icon: Mail,
    status: "available",
    category: "Messaging & Support",
    brandColor: "#ea4335"
  },

];

export function ApiIntegrations() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["Messaging & Support"]);
  const [twilioIntegrations, setTwilioIntegrations] = useState<TwilioIntegration[]>([]);
  const [calendarIntegrations, setCalendarIntegrations] = useState<UserCalendarCredentials[]>([]);
  const [whatsappIntegrations, setWhatsappIntegrations] = useState<any[]>([]);
  const [emailIntegrations, setEmailIntegrations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [twilioDialogOpen, setTwilioDialogOpen] = useState(false);
  const [calendarDialogOpen, setCalendarDialogOpen] = useState(false);
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);

  // Load credentials on component mount
  useEffect(() => {
    loadTwilioCredentials();
    loadCalendarCredentials();
    loadWhatsAppCredentials();
    loadEmailCredentials();
  }, []);

  const loadTwilioCredentials = async () => {
    try {
      setIsLoading(true);
      const credentials = await TwilioCredentialsService.getAllCredentials();
      const processed: TwilioIntegration[] = credentials.map(cred => ({
        id: cred.id,
        name: "Twilio",
        description: `Voice and SMS communications${cred.trunk_sid ? ' with auto-generated trunk' : ''}`,
        status: "connected" as const,
        lastUsed: formatLastUsed(cred.updated_at),
        details: {
          account: maskAccountSid(cred.account_sid),
          label: cred.label,
          trunkSid: cred.trunk_sid,
        },
      }));
      setTwilioIntegrations(processed);
    } catch (error) {
      console.error("Error loading Twilio credentials:", error);
      toast({ title: "Error", description: "Failed to load Twilio credentials.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const loadCalendarCredentials = async () => {
    try {
      const credentials = await CalendarCredentialsService.getAllCredentials();
      setCalendarIntegrations(credentials);
    } catch (error) {
      console.error("Error loading calendar credentials:", error);
      toast({ title: "Error", description: "Failed to load calendar credentials.", variant: "destructive" });
    }
  };

  const loadWhatsAppCredentials = async () => {
    try {
      const credentials = await WhatsAppCredentialsService.getAllCredentials();
      const processed = credentials.map(cred => ({
        id: cred.id,
        name: "WhatsApp Business",
        description: `WhatsApp Business messaging${cred.label ? ` - ${cred.label}` : ''}`,
        status: "connected" as const,
        lastUsed: formatLastUsed(cred.updated_at),
        details: {
          number: maskWhatsAppNumber(cred.whatsapp_number),
          label: cred.label,
        },
      }));
      setWhatsappIntegrations(processed);
    } catch (error) {
      console.error("Error loading WhatsApp credentials:", error);
      toast({ title: "Error", description: "Failed to load WhatsApp credentials.", variant: "destructive" });
    }
  };

  const loadEmailCredentials = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/v1/integrations`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      const data = await res.json();
      if (data.email) setEmailIntegrations(data.email);
    } catch (e) {
      console.error("Error loading email credentials:", e);
    }
  };

  const maskAccountSid = (accountSid: string): string => {
    if (accountSid.length <= 8) return accountSid;
    return accountSid.substring(0, 2) + "*".repeat(accountSid.length - 6) + accountSid.substring(accountSid.length - 4);
  };

  const formatLastUsed = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  };

  const maskWhatsAppNumber = (number: string): string => {
    if (number.length <= 4) return number;
    return number.slice(0, -4).replace(/./g, '*') + number.slice(-4);
  };

  const updatedIntegrations = useMemo(() => {
    return integrationsData.map(integration => {
      let status = "available";
      if (integration.id === "twilio") status = twilioIntegrations.length > 0 ? "connected" : "available";
      if (integration.id === "calcom") status = calendarIntegrations.length > 0 ? "connected" : "available";
      if (integration.id === "email") status = emailIntegrations.length > 0 ? "connected" : "available";
      return { ...integration, status };
    });
  }, [twilioIntegrations, calendarIntegrations, emailIntegrations]);

  const filteredIntegrations = useMemo(() => {
    return updatedIntegrations.filter(integration => {
      const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(integration.category);
      const matchesSearch = integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        integration.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [updatedIntegrations, selectedCategories, searchQuery]);

  const categories = Array.from(new Set(integrationsData.map(i => i.category)));
  const allCategories = [
    "Messaging & Support",
    "Project & Workflow"
  ];

  const handleTwilioConnect = async (data: any) => {
    try {
      const isValid = await TwilioCredentialsService.testCredentials(data);
      if (!isValid) {
        toast({ title: "Invalid credentials", description: "Please check your Twilio credentials.", variant: "destructive" });
        return;
      }
      await TwilioCredentialsService.saveCredentials(data);
      await loadTwilioCredentials();
      toast({ title: "Twilio connected", description: "Account connected successfully." });
    } catch (error) {
      toast({ title: "Connection failed", description: "Failed to connect Twilio.", variant: "destructive" });
    }
  };

  const handleRemoveIntegration = async (id: string) => {
    try {
      await TwilioCredentialsService.deleteCredentials(id);
      await loadTwilioCredentials();
      toast({ title: "Integration removed", description: "Twilio integration removed." });
    } catch (error) {
      toast({ title: "Removal failed", description: "Failed to remove integration.", variant: "destructive" });
    }
  };

  const handleRefreshIntegration = async (id: string) => {
    try {
      await TwilioCredentialsService.setActiveCredentials(id);
      await loadTwilioCredentials();
      toast({ title: "Integration refreshed", description: "Twilio integration set as active." });
    } catch (error) {
      toast({ title: "Refresh failed", description: "Failed to refresh integration.", variant: "destructive" });
    }
  };

  const handleCalendarConnect = async (data: CalendarCredentialsInput) => {
    try {
      await CalendarCredentialsService.saveCredentials(data);
      await loadCalendarCredentials();
      toast({ title: "Calendar connected", description: "Calendar connected successfully." });
    } catch (error) {
      toast({ title: "Connection failed", description: "Failed to connect calendar.", variant: "destructive" });
    }
  };

  const handleRemoveCalendarIntegration = async (id: string) => {
    try {
      await CalendarCredentialsService.deleteCredentials(id);
      await loadCalendarCredentials();
      toast({ title: "Integration removed", description: "Calendar integration removed." });
    } catch (error) {
      toast({ title: "Removal failed", description: "Failed to remove calendar integration.", variant: "destructive" });
    }
  };

  const handleRefreshCalendarIntegration = async (id: string) => {
    try {
      await CalendarCredentialsService.setActiveCredentials(id);
      await loadCalendarCredentials();
      toast({ title: "Integration refreshed", description: "Calendar integration set as active." });
    } catch (error) {
      toast({ title: "Refresh failed", description: "Failed to refresh calendar integration.", variant: "destructive" });
    }
  };

  const handleIntegrationClick = (integration: any) => {
    if (integration.id === "twilio") setTwilioDialogOpen(true);
    else if (integration.id === "calcom") setCalendarDialogOpen(true);
    else if (integration.id === "email") setEmailDialogOpen(true);
    else toast({ title: "Coming Soon", description: `${integration.name} integration is coming soon!` });
  };

  const IntegrationCard = ({ integration }: { integration: any }) => {
    const IconComponent = integration.icon;
    const isConnected = integration.status === "connected";

    const ActionButton = () => {
      const className = "text-[#374151] font-semibold hover:bg-gray-100 rounded-lg px-4 h-9";
      return <Button variant="ghost" className={className} onClick={() => handleIntegrationClick(integration)}>View details</Button>;
    };

    return (
      <Card className="bg-gray-500 rounded-[2rem] p-8 border-none shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] transition-all duration-300 flex flex-col h-full group relative">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ backgroundColor: `${integration.brandColor}12` }}
            >
              <IconComponent className="w-7 h-7" style={{ color: integration.brandColor }} />
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold text-[#1f2937] leading-none mb-0">{integration.name}</h3>
              {isConnected && (
                <div className="flex items-center justify-center w-5 h-5 bg-[#10b981] rounded-full">
                  <Check className="w-3 h-3 text-white" strokeWidth={4} />
                </div>
              )}
            </div>
          </div>
        </div>

        <p className="text-white text-[15px] leading-relaxed mb-8 flex-grow">
          {integration.description}
        </p>

        <div className="flex justify-end mt-auto">
          <ActionButton />
        </div>
      </Card>
    );
  };

  async function handleEmailConnect(data: any) {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/v1/integrations/email`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });
      if (res.ok) {
        toast({ title: "Connected", description: "Email account connected successfully" });
        loadEmailCredentials();
      } else {
        const err = await res.json();
        throw new Error(err.message || "Failed to connect email");
      }
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  }

  async function handleRemoveEmailIntegration(email: string) {
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'}/api/v1/integrations/email/${email}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (res.ok) {
        toast({ title: "Removed", description: "Email account removed" });
        loadEmailCredentials();
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message, variant: "destructive" });
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-transparent">
      {/* Top Search Bar */}
      <div className="relative mb-10">
        <div className="relative max-w-sm">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <Input
            className="pl-12 h-12 bg-gray-50/50 border-none rounded-2xl text-base focus-visible:ring-1 focus-visible:ring-primary/20 placeholder:text-gray-400 w-full"
            placeholder="Search here"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-12">
        {/* Sidebar */}
        <aside className="w-72 flex-shrink-0">
          <div className="mb-12">
            <h3 className="text-[#9ca3af] font-semibold mb-8 uppercase tracking-widest text-xs">Overview</h3>
            <div className="space-y-6">
              <div className="flex items-center justify-between group cursor-pointer hover:bg-gray-50/50 p-1 -m-1 rounded-lg transition-colors">
                <div className="flex items-center gap-3 text-[#374151]">
                  <CheckCircle2 className="w-5 h-5 text-[#374151]" />
                  <span className="font-medium">Connected</span>
                </div>
                <Badge variant="secondary" className="bg-[#f3f4f6] text-[#374151] rounded-lg px-2.5 py-0.5 border-none font-semibold">
                  {updatedIntegrations.filter(i => i.status === "connected").length}
                </Badge>
              </div>

            </div>
          </div>

          <div>
            <h3 className="text-[#9ca3af] font-semibold mb-8 uppercase tracking-widest text-xs">Categories</h3>
            <div className="space-y-5">
              <div className="flex items-center gap-3 group cursor-pointer" onClick={() => setSelectedCategories([])}>
                <div className={`w-5 h-5 border-2 rounded-[6px] flex items-center justify-center transition-colors ${selectedCategories.length === 0 ? 'bg-[#1f2937] border-[#1f2937]' : 'border-gray-300'}`}>
                  {selectedCategories.length === 0 && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                </div>
                <span className={`font-medium transition-colors ${selectedCategories.length === 0 ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>All</span>
              </div>
              {allCategories.map(category => (
                <div
                  key={category}
                  className="flex items-center gap-3 group cursor-pointer"
                  onClick={() => {
                    if (selectedCategories.includes(category)) {
                      setSelectedCategories(selectedCategories.filter(c => c !== category));
                    } else {
                      setSelectedCategories([...selectedCategories, category]);
                    }
                  }}
                >
                  <div className={`w-5 h-5 border-2 rounded-[6px] flex items-center justify-center transition-colors ${selectedCategories.includes(category) ? 'bg-[#1f2937] border-[#1f2937]' : 'border-gray-300'}`}>
                    {selectedCategories.includes(category) && <Check className="w-3.5 h-3.5 text-white" strokeWidth={4} />}
                  </div>
                  <span className={`font-medium transition-colors ${selectedCategories.includes(category) ? 'text-[#1f2937]' : 'text-[#6b7280]'}`}>
                    {category}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className="flex-1">
          <div className="mb-10">
            <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
            <div className="h-px bg-gray-100 w-full mt-6"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-8">
            {filteredIntegrations.map((integration) => (
              <IntegrationCard key={integration.id} integration={integration} />
            ))}
            {filteredIntegrations.length === 0 && (
              <div className="col-span-full py-20 text-center">
                <p className="text-gray-400 text-lg">No integrations found matching your criteria.</p>
              </div>
            )}
          </div>

          {/* Management Dialogs */}
          <TwilioManagementDialog
            open={twilioDialogOpen}
            onOpenChange={setTwilioDialogOpen}
            twilioIntegrations={twilioIntegrations}
            handleTwilioConnect={handleTwilioConnect}
            handleRemoveIntegration={handleRemoveIntegration}
          />

          <CalendarManagementDialog
            open={calendarDialogOpen}
            onOpenChange={setCalendarDialogOpen}
            calendarIntegrations={calendarIntegrations}
            handleCalendarConnect={handleCalendarConnect}
            handleRemoveCalendarIntegration={handleRemoveCalendarIntegration}
          />



          <EmailManagementDialog
            open={emailDialogOpen}
            onOpenChange={setEmailDialogOpen}
            emailIntegrations={emailIntegrations}
            handleEmailConnect={handleEmailConnect}
            handleRemoveEmailIntegration={handleRemoveEmailIntegration}
          />

          <div className="mt-16">
            <SecurityCard />
          </div>
        </div>
      </div>
      <div className="h-20" />
    </div>
  );
}
