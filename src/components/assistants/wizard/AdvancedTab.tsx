import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Plus, X, ChevronDown, Shield, Mic, Video, Music, Phone, MessageSquare, ArrowRightLeft, Check } from "lucide-react";
import { AdvancedData } from "./types";
import { WizardSlider } from "./WizardSlider";

interface AdvancedTabProps {
  data: AdvancedData;
  onChange: (data: Partial<AdvancedData>) => void;
}

export const AdvancedTab: React.FC<AdvancedTabProps> = ({ data, onChange }) => {
  const [isCountryDropdownOpen, setIsCountryDropdownOpen] = useState(false);

  const countries = [
    { code: "+1", flag: "🇺🇸", name: "United States" },
    { code: "+44", flag: "🇬🇧", name: "United Kingdom" },
    { code: "+33", flag: "🇫🇷", name: "France" },
    { code: "+49", flag: "🇩🇪", name: "Germany" },
    { code: "+81", flag: "🇯🇵", name: "Japan" },
    { code: "+86", flag: "🇨🇳", name: "China" },
    { code: "+91", flag: "🇮🇳", name: "India" },
    { code: "+61", flag: "🇦🇺", name: "Australia" },
    { code: "+55", flag: "🇧🇷", name: "Brazil" },
    { code: "+7", flag: "🇷🇺", name: "Russia" },
    { code: "+34", flag: "🇪🇸", name: "Spain" },
    { code: "+39", flag: "🇮🇹", name: "Italy" },
    { code: "+31", flag: "🇳🇱", name: "Netherlands" },
    { code: "+46", flag: "🇸🇪", name: "Sweden" },
    { code: "+47", flag: "🇳🇴", name: "Norway" }
  ];

  const selectedCountry = countries.find(c => c.code === (data.transferCountryCode || "+1"));

  const addEndCallPhrase = () => {
    onChange({
      endCallPhrases: [...data.endCallPhrases, ""]
    });
  };

  const updateEndCallPhrase = (index: number, value: string) => {
    const updated = [...data.endCallPhrases];
    updated[index] = value;
    onChange({ endCallPhrases: updated });
  };

  const removeEndCallPhrase = (index: number) => {
    const updated = data.endCallPhrases.filter((_, i) => i !== index);
    onChange({ endCallPhrases: updated });
  };

  return (
    <div className="max-w-4xl space-y-[var(--space-2xl)]">


      {/* Call Transfer */}
      <Card variant="default">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <h3 className="text-lg font-medium">Call Transfer</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure call transfer settings to route calls to another number
            </p>
          </div>
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-[var(--space-xl)]">
          {/* Enable Transfer */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-[var(--space-md)]">
              <ArrowRightLeft className="h-5 w-5 text-muted-foreground" />
              <div>
                <Label className="text-sm font-medium">Enable Call Transfer</Label>
                <p className="text-xs text-muted-foreground">
                  Allow the assistant to transfer calls to another number when conditions are met
                </p>
              </div>
            </div>
            <Switch
              checked={data.transferEnabled}
              onCheckedChange={(checked) => onChange({ transferEnabled: checked })}
            />
          </div>

          {data.transferEnabled && (
            <>
              {/* Transfer Phone Number */}
              <div className="space-y-[var(--space-md)]">
                <Label className="text-sm font-medium">Phone Number</Label>
                <p className="text-xs text-muted-foreground mb-[var(--space-md)]">
                  The phone number to transfer calls to when transfer conditions are met
                </p>
                <div className="flex gap-2">
                  <Popover open={isCountryDropdownOpen} onOpenChange={setIsCountryDropdownOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={isCountryDropdownOpen}
                        className="w-24 h-12 justify-between text-left font-normal"
                      >
                        {selectedCountry ? `${selectedCountry.flag} ${selectedCountry.code}` : "+1"}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-64 p-0" align="start">
                      <Command>
                        <CommandInput placeholder="Search country..." />
                        <CommandList>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {countries.map((country) => (
                              <CommandItem
                                key={country.code}
                                value={`${country.name} ${country.code}`}
                                onSelect={() => {
                                  onChange({ transferCountryCode: country.code });
                                  setIsCountryDropdownOpen(false);
                                }}
                              >
                                <Check
                                  className={`mr-2 h-4 w-4 ${(data.transferCountryCode || "+1") === country.code ? "opacity-100" : "opacity-0"
                                    }`}
                                />
                                <span className="mr-2">{country.flag}</span>
                                <span className="mr-2">{country.code}</span>
                                <span className="text-muted-foreground">{country.name}</span>
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                  <Input
                    placeholder="Phone number"
                    value={data.transferPhoneNumber || ""}
                    onChange={(e) => onChange({ transferPhoneNumber: e.target.value })}
                    className="flex-1 h-12"
                  />
                </div>
              </div>

              {/* Transfer Sentence */}
              <div className="space-y-[var(--space-md)]">
                <Label className="text-sm font-medium">Transfer Sentence</Label>
                <p className="text-xs text-muted-foreground mb-[var(--space-md)]">
                  What the assistant will say before transferring the call
                </p>
                <Textarea
                  placeholder="I'm going to transfer you to someone who can better help you with that..."
                  value={data.transferSentence || ""}
                  onChange={(e) => onChange({ transferSentence: e.target.value })}
                  rows={2}
                  className="w-full"
                />
              </div>

              {/* Transfer Condition */}
              <div className="space-y-[var(--space-md)]">
                <Label className="text-sm font-medium">Transfer Condition</Label>
                <p className="text-xs text-muted-foreground mb-[var(--space-md)]">
                  Describe when the assistant should transfer the call
                </p>
                <Textarea
                  placeholder="Transfer when the customer asks to speak to a manager or requests technical support..."
                  value={data.transferCondition || ""}
                  onChange={(e) => onChange({ transferCondition: e.target.value })}
                  rows={2}
                  className="w-full"
                />
              </div>


            </>
          )}
        </CardContent>
      </Card>

      {/* Call Management */}
      <Card variant="default">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <h3 className="text-lg font-medium">Call Management</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Configure call handling, idle messages, and timeout settings
            </p>
          </div>
          <Phone className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent className="space-y-[var(--space-xl)]">
          {/* End Call Message */}
          <div className="space-y-[var(--space-md)]">
            <Label className="text-sm font-medium">End Call Message</Label>
            <p className="text-xs text-muted-foreground">
              This message will be spoken by the assistant when the call is ended.
            </p>
            <Input
              placeholder="Thank you for calling. Have a great day!"
              value={data.endCallMessage}
              onChange={(e) => onChange({ endCallMessage: e.target.value })}
              className="w-full"
            />
          </div>

          {/* Idle Messages */}
          <div className="space-y-[var(--space-md)]">
            <Label className="text-sm font-medium">Idle Messages</Label>
            <p className="text-xs text-muted-foreground">
              Messages the assistant will use when the user hasn't responded (comma-separated)
            </p>
            <Textarea
              placeholder="Are you still there?, I'm still here if you need anything, Did you have any other questions?"
              value={data.idleMessages.join(', ')}
              onChange={(e) => onChange({ idleMessages: e.target.value.split(',').map(msg => msg.trim()).filter(msg => msg) })}
              rows={3}
              className="w-full"
            />
          </div>

          <div className="grid grid-cols-2 gap-[var(--space-lg)]">
            {/* Max Idle Messages */}
            <div className="space-y-[var(--space-md)]">
              <Label className="text-sm font-medium">Max Idle Messages</Label>
              <p className="text-xs text-muted-foreground">
                Maximum number of idle messages before ending call
              </p>
              <Input
                type="number"
                min="1"
                max="10"
                value={data.idleMessageMaxSpokenCount}
                onChange={(e) => onChange({ idleMessageMaxSpokenCount: parseInt(e.target.value) || 3 })}
                className="text-center"
                placeholder="3"
              />
            </div>

            {/* Idle Timeout */}
            <div className="space-y-[var(--space-md)]">
              <Label className="text-sm font-medium">Idle Timeout (seconds)</Label>
              <p className="text-xs text-muted-foreground">
                Time to wait before sending idle message
              </p>
              <Input
                type="number"
                min="5"
                max="60"
                value={data.silenceTimeoutSeconds}
                onChange={(e) => onChange({ silenceTimeoutSeconds: parseInt(e.target.value) || 10 })}
                className="text-center"
                placeholder="10"
              />
            </div>
          </div>

          {/* Maximum Call Duration */}
          <div className="space-y-[var(--space-md)]">
            <Label className="text-sm font-medium">Maximum Call Duration (minutes)</Label>
            <p className="text-xs text-muted-foreground">
              Automatically end calls after this duration to prevent excessive charges
            </p>
            <Input
              type="number"
              min="1"
              max="120"
              value={data.maxCallDuration}
              onChange={(e) => onChange({ maxCallDuration: parseInt(e.target.value) || 30 })}
              className="w-32 text-center"
              placeholder="30"
            />
          </div>
        </CardContent>
      </Card>


    </div>
  );
};