import React from "react";
import { Button } from "@/components/ui/button";
import { Edit2, LucideIcon } from "lucide-react";

interface ContactPropertyProps {
  label: string;
  value: string;
  icon: LucideIcon;
  editable?: boolean;
}

export function ContactProperty({ label, value, icon: Icon, editable = true }: ContactPropertyProps) {
  const handleEdit = () => {
    // TODO: Implement property editing
    console.log("Edit property:", label);
  };

  return (
    <div className="flex items-center justify-between p-3 bg-zinc-800/50 rounded-lg border border-zinc-700/50 group hover:bg-zinc-800/70 transition-colors">
      <div className="flex items-center space-x-3 flex-1">
        <Icon className="w-4 h-4 text-zinc-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-xs text-zinc-400 mb-0.5">{label}</div>
          <div className="text-sm text-white truncate font-medium">{value}</div>
        </div>
      </div>
      
      {editable && (
        <Button
          size="sm"
          variant="ghost"
          onClick={handleEdit}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 text-zinc-400 hover:text-white hover:bg-zinc-700/50"
        >
          <Edit2 className="w-3.5 h-3.5" />
        </Button>
      )}
    </div>
  );
}