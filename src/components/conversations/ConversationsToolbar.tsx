import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import TimeRangeSelector from "@/components/dashboard/TimeRangeSelector";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ConversationsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  resolutionFilter: string;
  onResolutionChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export default function ConversationsToolbar({
  searchQuery,
  onSearchChange,
  resolutionFilter,
  onResolutionChange,
  dateRange,
  onDateRangeChange,
}: ConversationsToolbarProps) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
        <Input
          placeholder="Search conversations..."
          className="pl-10 h-9 w-64 bg-secondary/50 border-input text-foreground placeholder:text-muted-foreground focus:border-primary/50"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="w-48">
        <TimeRangeSelector onRangeChange={onDateRangeChange} />
      </div>

      <div className="w-48">
        <Select value={resolutionFilter} onValueChange={onResolutionChange}>
          <SelectTrigger className="h-9 bg-secondary/50 border-input text-foreground">
            <SelectValue placeholder="All Outcomes" />
          </SelectTrigger>
          <SelectContent className="bg-popover border-border backdrop-blur-sm">
            <SelectItem value="all" className="text-foreground hover:bg-accent">All Outcomes</SelectItem>
            <SelectItem value="booked appointment" className="text-foreground hover:bg-accent">Booked Appointment</SelectItem>
            <SelectItem value="qualified" className="text-foreground hover:bg-accent">Qualified</SelectItem>
            <SelectItem value="not qualified" className="text-foreground hover:bg-accent">Not Qualified</SelectItem>
            <SelectItem value="spam" className="text-foreground hover:bg-accent">Spam</SelectItem>
            <SelectItem value="escalated" className="text-foreground hover:bg-accent">Escalated</SelectItem>
            <SelectItem value="call dropped" className="text-foreground hover:bg-accent">Call Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}