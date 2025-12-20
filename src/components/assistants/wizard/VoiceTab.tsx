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





  return (
    <div className="">
      {/* Header Section */}


      {/* Card 1 - Voice Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-medium">Voice Characteristics</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8">
          {/* Voice Selection - Only show Voice dropdown */}
          <div className="max-w-md">
            <div className="space-y-3">
              <Label className="text-base font-semibold tracking-tight">Voice</Label>
              <Select value={data.voice} onValueChange={(value) => onChange({ voice: value })}>
                <SelectTrigger className="w-full h-11">
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
          </div>
        </CardContent>
      </Card>

      {/* Card 2 - Additional Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl font-medium tracking-tight">Additional Configuration</CardTitle>
          <CardDescription>Configure additional settings for the voice of your assistant.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6 sm:space-y-8">
          {/* Config Adapter Section */}
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <Label className="text-base font-semibold tracking-tight">Background Sound</Label>
              <Select value={data.backgroundSound || "off"} onValueChange={(value) => onChange({ backgroundSound: value })}>
                <SelectTrigger className="w-full sm:w-[180px] h-11">
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