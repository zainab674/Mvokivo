import React, { useState } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles } from "lucide-react";
import { DataFieldSuggestion } from "@/utils/dataTypeInference";

interface IntelligentDataFieldProps {
  onAdd: (field: DataFieldSuggestion) => void;
}

export const IntelligentDataField: React.FC<IntelligentDataFieldProps> = ({ 
  onAdd
}) => {
  const [input, setInput] = useState("");

  const handleCreateFields = () => {
    if (!input.trim()) return;
    
    // Split by comma or newline to support multiple fields
    const fieldNames = input
      .split(/[,\n]/)
      .map(name => name.trim())
      .filter(name => name.length > 0);
    
    // Create a field for each entered name
    fieldNames.forEach(fieldName => {
      const field: DataFieldSuggestion = {
        name: fieldName,
        type: "string",
        description: `Extract ${fieldName} from conversation`,
        confidence: 1.0,
        required: false
      };
      onAdd(field);
    });
    
    // Clear input after creating fields
    setInput("");
  };

  const handleClear = () => {
    setInput("");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-primary" />
        <Label className="text-sm font-medium">What would you like to track?</Label>
      </div>
      
      <div className="space-y-3">
        <Textarea
          placeholder="mother name, customer email, appointment time..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              handleCreateFields();
            }
          }}
          className="resize-none h-24 text-[15px]"
        />
        
        <div className="flex gap-2">
          <Button
            onClick={handleCreateFields}
            disabled={!input.trim()}
            className="gap-2"
          >
            <Sparkles className="h-4 w-4" />
            Create Fields
          </Button>
          
          {input && (
            <Button variant="outline" onClick={handleClear}>
              Clear
            </Button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Enter field names separated by commas. For example: "mother name, customer email, phone number"
        </p>
      </div>
    </div>
  );
};

