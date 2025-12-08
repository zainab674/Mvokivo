import React, { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardHeader, CardContent, CardTitle, CardDescription } from "@/components/ui/card";
import { ChevronDown, Info } from "lucide-react";
import { VoiceData } from "./types";
import { WizardSlider } from "./WizardSlider";

interface VoiceTabProps {
  data: VoiceData;
  onChange: (data: Partial<VoiceData>) => void;
}

export const VoiceTab: React.FC<VoiceTabProps> = ({ data, onChange }) => {
  const [advancedTimingOpen, setAdvancedTimingOpen] = useState(false);
  const [advancedInterruptionOpen, setAdvancedInterruptionOpen] = useState(false);

  // Ensure Cartesia is always set as the default provider with sonic-3 model and first voice
  useEffect(() => {
    const updates: Partial<VoiceData> = {};
    if (data.provider !== "Cartesia") {
      updates.provider = "Cartesia";
    }
    if (data.model !== "sonic-3") {
      updates.model = "sonic-3";
    }
    if (data.voice !== "41468051-3a85-4b68-92ad-64add250d369") {
      updates.voice = "41468051-3a85-4b68-92ad-64add250d369";
    }
    if (Object.keys(updates).length > 0) {
      onChange(updates);
    }
  }, [data.provider, data.model, data.voice, onChange]);

  // Filter voices based on selected provider
  const getFilteredVoices = () => {
    switch (data.provider) {
      case "ElevenLabs":
        return [
          { value: "Rachel", label: "Rachel" },
          { value: "Domi", label: "Domi" },
          { value: "Bella", label: "Bella" },
          { value: "Antoni", label: "Antoni" },
          { value: "Elli", label: "Elli" },
          { value: "Josh", label: "Josh" },
          { value: "Arnold", label: "Arnold" }
        ];
      case "Rime":
        // Show only Arcana voices when Arcana model is selected
        if (data.model === "arcana") {
          return [
            { value: "luna", label: "Luna - female, chill but excitable, gen-z optimist" },
            { value: "ursa", label: "Ursa - male, 20 years old, encyclopedic knowledge of 2000s emo" },
            { value: "astra", label: "Astra - female, young, wide-eyed" },
            { value: "walnut", label: "Walnut" },
            { value: "miyamoto_akari", label: "Miyamoto Akari" },
            { value: "marlu", label: "Marlu" }
          ];
        }
        // Show other Rime voices for other models
        return [
          { value: "ana", label: "Ana" },
          { value: "amber", label: "Amber" },
          { value: "amalia", label: "Amalia" },
          { value: "alpine", label: "Alpine" },
          { value: "alona", label: "Alona" },
          { value: "ally", label: "Ally" },
          { value: "walnut", label: "Walnut" },
          { value: "miyamoto_akari", label: "Miyamoto Akari" },
          { value: "patel_amit", label: "Patel Amit" },
          { value: "celeste", label: "Celeste" },
          { value: "kima", label: "Kima" },
          { value: "marlu", label: "Marlu" },
          { value: "morel_marianne", label: "Morel Marianne" },
          { value: "solstice", label: "Solstice" },
          { value: "livet_aurelie", label: "Livet Aurelie" },
          { value: "destin", label: "Destin" }
        ];
      case "Hume":
        // Default Hume voices only (Octave-2 disabled)
        return [
          { value: "Colton Rivers", label: "Colton Rivers" },
          { value: "Sarah Chen", label: "Sarah Chen" },
          { value: "David Mitchell", label: "David Mitchell" },
          { value: "Emma Williams", label: "Emma Williams" },
          { value: "Charming Cowgirl", label: "Charming Cowgirl" },
          { value: "Soft Male Conversationalist", label: "Soft Male Conversationalist" },
          { value: "Scottish Guy", label: "Scottish Guy" },
          { value: "Conversational English Guy", label: "Conversational English Guy" },
          { value: "English Casual Conversationalist", label: "English Casual Conversationalist" }
        ];
      case "Deepgram":
        // Show only the selected model as a voice option
        // In Deepgram, model and voice are the same
        if (data.model) {
          return [
            { value: data.model, label: getFilteredModels().find(m => m.value === data.model)?.label || data.model }
          ];
        }
        return [
          { value: "aura-asteria-en", label: "Aura Asteria" }
        ];
      case "Cartesia":
        // Cartesia Sonic 3 voices with names
        return [
          { value: "41468051-3a85-4b68-92ad-64add250d369", label: "Cory" },
          { value: "6c64b57a-bc65-48e4-bff4-12dbe85606cd", label: "Eloise" },
          { value: "95d51f79-c397-46f9-b49a-23763d3eaa2d", label: "Arushi" },
          { value: "9cebb910-d4b7-4a4a-85a4-12c79137724c", label: "Aarti" },
          { value: "a01c369f-6d2d-4185-bc20-b32c225eab70", label: "Fiona" },
          { value: "726d5ae5-055f-4c3d-8355-d9677de68937", label: "Troy" },
          { value: "ce74c4da-4aee-435d-bc6d-81d1a9367e12", label: "Maroc" },
          { value: "22f1a356-56c2-4428-bc91-2ab2e6d0c215", label: "Isabelle" },
          { value: "ee8b13e7-98af-4b15-89d1-8d402be10c94", label: "Carson" },
          { value: "5cad89c9-d88a-4832-89fb-55f2f16d13d3", label: "Brandon - Emotive" },
          { value: "e07c00bc-4134-4eae-9ea4-1a55fb45746b", label: "Brooke - Emotive" },
          { value: "6ccbfb76-1fc6-48f7-b71d-91ac6298247b", label: "Tessa - Emotive" },
          { value: "ec1e269e-9ca0-402f-8a18-58e0e022355a", label: "Ariana - Emotive" }
        ];
      default:
        return [];
    }
  };

  // Filter models based on selected provider
  const getFilteredModels = () => {
    switch (data.provider) {
      case "ElevenLabs":
        return [
          { value: "eleven_turbo_v2", label: "Eleven Turbo v2" },
          { value: "eleven_multilingual_v2", label: "Eleven Multilingual v2" }
        ];
      case "Rime":
        return [
          { value: "mistv2", label: "Mist v2" },
          { value: "arcana", label: "Arcana" }
        ];
      case "Hume":
        return [
          { value: "hume_default", label: "Hume Default" }
        ];
      case "Deepgram":
        return [
          { value: "aura-2-thalia-en", label: "Aura 2 - Thalia" },
          { value: "aura-2-andromeda-en", label: "Aura 2 - Andromeda" },
          { value: "aura-2-helena-en", label: "Aura 2 - Helena" },
          { value: "aura-2-apollo-en", label: "Aura 2 - Apollo" },
          { value: "aura-2-arcas-en", label: "Aura 2 - Arcas" },
          { value: "aura-2-aries-en", label: "Aura 2 - Aries" },
          { value: "aura-asteria-en", label: "Aura Asteria" },
          { value: "aura-luna-en", label: "Aura Luna" },
          { value: "aura-stella-en", label: "Aura Stella" },
          { value: "aura-athena-en", label: "Aura Athena" },
          { value: "aura-hera-en", label: "Aura Hera" },
          { value: "aura-orion-en", label: "Aura Orion" },
          { value: "aura-arcas-en", label: "Aura Arcas" },
          { value: "aura-perseus-en", label: "Aura Perseus" },
          { value: "aura-angus-en", label: "Aura Angus" },
          { value: "aura-orpheus-en", label: "Aura Orpheus" },
          { value: "aura-helios-en", label: "Aura Helios" },
          { value: "aura-zeus-en", label: "Aura Zeus" }
        ];
      case "Cartesia":
        return [
          { value: "sonic-3", label: "Sonic 3" }
        ];
      default:
        return [];
    }
  };

  // Handle provider change and reset voice/model if needed
  const handleProviderChange = (value: string) => {
    // Get filtered options for the new provider
    const getFilteredVoicesForProvider = (provider: string) => {
      switch (provider) {
        case "ElevenLabs":
          return [
            { value: "Rachel", label: "Rachel" },
            { value: "Domi", label: "Domi" },
            { value: "Bella", label: "Bella" },
            { value: "Antoni", label: "Antoni" },
            { value: "Elli", label: "Elli" },
            { value: "Josh", label: "Josh" },
            { value: "Arnold", label: "Arnold" }
          ];
        case "Rime":
          // For provider changes, show all Rime voices
          // They will be filtered by getFilteredVoices() based on selected model
          return [
            { value: "ana", label: "Ana" },
            { value: "amber", label: "Amber" },
            { value: "amalia", label: "Amalia" },
            { value: "alpine", label: "Alpine" },
            { value: "alona", label: "Alona" },
            { value: "ally", label: "Ally" },
            { value: "luna", label: "Luna - female, chill but excitable, gen-z optimist" },
            { value: "orion", label: "Orion - male, older, african american, happy" },
            { value: "ursa", label: "Ursa - male, 20 years old, encyclopedic knowledge of 2000s emo" },
            { value: "astra", label: "Astra - female, young, wide-eyed" },
            { value: "walnut", label: "Walnut" },
            { value: "miyamoto_akari", label: "Miyamoto Akari" },
            { value: "patel_amit", label: "Patel Amit" },
            { value: "celeste", label: "Celeste" },
            { value: "kima", label: "Kima" },
            { value: "marlu", label: "Marlu" },
            { value: "morel_marianne", label: "Morel Marianne" },
            { value: "solstice", label: "Solstice" },
            { value: "livet_aurelie", label: "Livet Aurelie" },
            { value: "destin", label: "Destin" }
          ];
        case "Hume":
          return [
            { value: "Colton Rivers", label: "Colton Rivers" },
            { value: "Sarah Chen", label: "Sarah Chen" },
            { value: "David Mitchell", label: "David Mitchell" },
            { value: "Emma Williams", label: "Emma Williams" },
            { value: "Charming Cowgirl", label: "Charming Cowgirl" },
            { value: "Soft Male Conversationalist", label: "Soft Male Conversationalist" },
            { value: "Scottish Guy", label: "Scottish Guy" },
            { value: "Conversational English Guy", label: "Conversational English Guy" },
            { value: "English Casual Conversationalist", label: "English Casual Conversationalist" }
          ];
        case "Deepgram":
          return [
            { value: "aura-2-thalia-en", label: "Aura 2 - Thalia" },
            { value: "aura-2-andromeda-en", label: "Aura 2 - Andromeda" },
            { value: "aura-2-helena-en", label: "Aura 2 - Helena" },
            { value: "aura-2-apollo-en", label: "Aura 2 - Apollo" },
            { value: "aura-2-arcas-en", label: "Aura 2 - Arcas" },
            { value: "aura-2-aries-en", label: "Aura 2 - Aries" },
            { value: "aura-asteria-en", label: "Aura Asteria" },
            { value: "aura-luna-en", label: "Aura Luna" },
            { value: "aura-stella-en", label: "Aura Stella" },
            { value: "aura-athena-en", label: "Aura Athena" },
            { value: "aura-hera-en", label: "Aura Hera" },
            { value: "aura-orion-en", label: "Aura Orion" },
            { value: "aura-arcas-en", label: "Aura Arcas" },
            { value: "aura-perseus-en", label: "Aura Perseus" },
            { value: "aura-angus-en", label: "Aura Angus" },
            { value: "aura-orpheus-en", label: "Aura Orpheus" },
            { value: "aura-helios-en", label: "Aura Helios" },
            { value: "aura-zeus-en", label: "Aura Zeus" }
          ];
        case "Cartesia":
          return [
            { value: "41468051-3a85-4b68-92ad-64add250d369", label: "Cory" },
            { value: "6c64b57a-bc65-48e4-bff4-12dbe85606cd", label: "Eloise" },
            { value: "95d51f79-c397-46f9-b49a-23763d3eaa2d", label: "Arushi" },
            { value: "9cebb910-d4b7-4a4a-85a4-12c79137724c", label: "Aarti" },
            { value: "a01c369f-6d2d-4185-bc20-b32c225eab70", label: "Fiona" },
            { value: "726d5ae5-055f-4c3d-8355-d9677de68937", label: "Troy" },
            { value: "ce74c4da-4aee-435d-bc6d-81d1a9367e12", label: "Maroc" },
            { value: "22f1a356-56c2-4428-bc91-2ab2e6d0c215", label: "Isabelle" },
            { value: "ee8b13e7-98af-4b15-89d1-8d402be10c94", label: "Carson" },
            { value: "5cad89c9-d88a-4832-89fb-55f2f16d13d3", label: "Brandon - Emotive" },
            { value: "e07c00bc-4134-4eae-9ea4-1a55fb45746b", label: "Brooke - Emotive" },
            { value: "6ccbfb76-1fc6-48f7-b71d-91ac6298247b", label: "Tessa - Emotive" },
            { value: "ec1e269e-9ca0-402f-8a18-58e0e022355a", label: "Ariana - Emotive" }
          ];
        default:
          return [];
      }
    };

    const getFilteredModelsForProvider = (provider: string) => {
      switch (provider) {
        case "ElevenLabs":
          return [
            { value: "eleven_turbo_v2", label: "Eleven Turbo v2" },
            { value: "eleven_multilingual_v2", label: "Eleven Multilingual v2" }
          ];
        case "Rime":
          return [
            { value: "mistv2", label: "Mist v2" },
            { value: "arcana", label: "Arcana" }
          ];
        case "Hume":
          return [
            { value: "hume_default", label: "Hume Default" }
          ];
        case "Deepgram":
          return [
            { value: "aura-2-thalia-en", label: "Aura 2 - Thalia" },
            { value: "aura-2-andromeda-en", label: "Aura 2 - Andromeda" },
            { value: "aura-2-helena-en", label: "Aura 2 - Helena" },
            { value: "aura-2-apollo-en", label: "Aura 2 - Apollo" },
            { value: "aura-2-arcas-en", label: "Aura 2 - Arcas" },
            { value: "aura-2-aries-en", label: "Aura 2 - Aries" },
            { value: "aura-asteria-en", label: "Aura Asteria" },
            { value: "aura-luna-en", label: "Aura Luna" },
            { value: "aura-stella-en", label: "Aura Stella" },
            { value: "aura-athena-en", label: "Aura Athena" },
            { value: "aura-hera-en", label: "Aura Hera" },
            { value: "aura-orion-en", label: "Aura Orion" },
            { value: "aura-arcas-en", label: "Aura Arcas" },
            { value: "aura-perseus-en", label: "Aura Perseus" },
            { value: "aura-angus-en", label: "Aura Angus" },
            { value: "aura-orpheus-en", label: "Aura Orpheus" },
            { value: "aura-helios-en", label: "Aura Helios" },
            { value: "aura-zeus-en", label: "Aura Zeus" }
          ];
        case "Cartesia":
          return [
            { value: "sonic-3", label: "Sonic 3" }
          ];
        default:
          return [];
      }
    };

    const filteredVoices = getFilteredVoicesForProvider(value);
    const filteredModels = getFilteredModelsForProvider(value);
    
    // Check if current voice is valid for new provider
    const isCurrentVoiceValid = filteredVoices.some(voice => voice.value === data.voice);
    const isCurrentModelValid = filteredModels.some(model => model.value === data.model);
    
    const updates: Partial<VoiceData> = { provider: value };
    
    // Reset model if not valid for new provider
    if (!isCurrentModelValid && filteredModels.length > 0) {
      updates.model = filteredModels[0].value;
    }
    
    // Reset voice if not valid for new provider
    // For Deepgram, voice should match the model
    if (value === "Deepgram" && filteredModels.length > 0) {
      updates.voice = updates.model || filteredModels[0].value;
    } else if (value === "Cartesia" && filteredVoices.length > 0) {
      // For Cartesia, use first Sonic 3 voice
      updates.voice = "41468051-3a85-4b68-92ad-64add250d369";
    } else if (!isCurrentVoiceValid && filteredVoices.length > 0) {
      updates.voice = filteredVoices[0].value;
    }
    
    onChange(updates);
  };

    // Handle model change and reset voice if needed
  const handleModelChange = (value: string) => {
    // For Deepgram, model and voice are the same
    if (data.provider === "Deepgram") {
      onChange({ model: value, voice: value });
      return;
    }
    
    // For Cartesia, use first voice when model changes
    if (data.provider === "Cartesia") {
      onChange({ model: value, voice: "41468051-3a85-4b68-92ad-64add250d369" });
      return;
    }
    
    // For Rime, check if current voice is valid for the new model
    if (data.provider === "Rime") {
      // Determine available voices for the new model
      let availableVoices;
      if (value === "arcana") {
        availableVoices = [
          { value: "luna", label: "Luna - female, chill but excitable, gen-z optimist" },
          { value: "ursa", label: "Ursa - male, 20 years old, encyclopedic knowledge of 2000s emo" },
          { value: "astra", label: "Astra - female, young, wide-eyed" },
          { value: "walnut", label: "Walnut" },
          { value: "miyamoto_akari", label: "Miyamoto Akari" },
          { value: "marlu", label: "Marlu" }
        ];
      } else {
        availableVoices = [
          { value: "ana", label: "Ana" },
          { value: "amber", label: "Amber" },
          { value: "amalia", label: "Amalia" },
          { value: "alpine", label: "Alpine" },
          { value: "alona", label: "Alona" },
          { value: "ally", label: "Ally" },
          { value: "walnut", label: "Walnut" },
          { value: "miyamoto_akari", label: "Miyamoto Akari" },
          { value: "patel_amit", label: "Patel Amit" },
          { value: "celeste", label: "Celeste" },
          { value: "kima", label: "Kima" },
          { value: "marlu", label: "Marlu" },
          { value: "morel_marianne", label: "Morel Marianne" },
          { value: "solstice", label: "Solstice" },
          { value: "livet_aurelie", label: "Livet Aurelie" },
          { value: "destin", label: "Destin" }
        ];
      }
      
      const isCurrentVoiceValid = availableVoices.some(voice => voice.value === data.voice);
      
      const updates: Partial<VoiceData> = { model: value };
      
      // Reset voice if not valid for new model
      if (!isCurrentVoiceValid && availableVoices.length > 0) {
        updates.voice = availableVoices[0].value;
      }
      
      onChange(updates);
    } 
    // For Hume, use default voices only (Octave-2 disabled)
    else if (data.provider === "Hume") {
      const defaultVoices = [
        { value: "Colton Rivers", label: "Colton Rivers" },
        { value: "Sarah Chen", label: "Sarah Chen" },
        { value: "David Mitchell", label: "David Mitchell" },
        { value: "Emma Williams", label: "Emma Williams" },
        { value: "Charming Cowgirl", label: "Charming Cowgirl" },
        { value: "Soft Male Conversationalist", label: "Soft Male Conversationalist" },
        { value: "Scottish Guy", label: "Scottish Guy" },
        { value: "Conversational English Guy", label: "Conversational English Guy" },
        { value: "English Casual Conversationalist", label: "English Casual Conversationalist" }
      ];
      
      const isCurrentVoiceValid = defaultVoices.some(voice => voice.value === data.voice);
      
      const updates: Partial<VoiceData> = { model: value };
      
      // Reset voice if not valid for new model
      if (!isCurrentVoiceValid && defaultVoices.length > 0) {
        updates.voice = defaultVoices[0].value;
      }
      
      onChange(updates);
    } else {
      onChange({ model: value });
    }
  };

  return (
    <div className="space-y-8 p-8">
      {/* Header Section */}
      <div className="mb-10">
        <h1 className="text-[28px] font-light tracking-[0.2px] mb-2">
          Voice Identity
        </h1>
        <p className="text-[1.08rem] pr-2 max-w-xl text-muted-foreground">
          Define how your assistant sounds to create a memorable brand experience.
        </p>
      </div>

      {/* Card 1 - Voice Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Voice Characteristics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Provider, Voice, Model Selection */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-3">
              <Label className="text-[16px] font-semibold tracking-[0.2px]">Provider</Label>
              <Select value={data.provider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  
                  
                  <SelectItem value="Cartesia">Cartesia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[16px] font-semibold tracking-[0.2px]">Voice</Label>
              <Select value={data.voice} onValueChange={(value) => onChange({ voice: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredVoices().map((voice) => (
                    <SelectItem key={voice.value} value={voice.value}>
                      {voice.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3">
              <Label className="text-[16px] font-semibold tracking-[0.2px]">Model</Label>
              <Select value={data.model || "eleven_turbo_v2"} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getFilteredModels().map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          
        </CardContent>
      </Card>

      {/* Card 2 - Additional Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-[20px] font-medium tracking-[0.2px]">Additional Configuration</CardTitle>
          <CardDescription>Configure additional settings for the voice of your assistant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Config Adapter Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <Label className="text-[16px] font-semibold tracking-[0.2px]">Background Sound</Label>
              <Select value={data.backgroundSound || "off"} onValueChange={(value) => onChange({ backgroundSound: value })}>
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="office">Office</SelectItem>
                  <SelectItem value="cafe">Cafe</SelectItem>
                  <SelectItem value="nature">Nature</SelectItem>
                  <SelectItem value="white-noise">White Noise</SelectItem>
                </SelectContent>
              </Select>
            </div>

         
          </div>


         
        </CardContent>
      </Card>

     
     

    </div>
  );
};