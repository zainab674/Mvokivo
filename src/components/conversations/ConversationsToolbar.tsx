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
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 z-10" />
        <Input 
          placeholder="Search conversations..." 
          className="pl-10 h-9 w-64 bg-zinc-800/50 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-indigo-500/50"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      
      <div className="w-48">
        <TimeRangeSelector onRangeChange={onDateRangeChange} />
      </div>
      
      <div className="w-48">
        <Select value={resolutionFilter} onValueChange={onResolutionChange}>
          <SelectTrigger className="h-9 bg-zinc-800/50 border-zinc-700/50 text-white">
            <SelectValue placeholder="All Outcomes" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-800/95 border-zinc-700/50 backdrop-blur-sm">
            <SelectItem value="all" className="text-white hover:bg-zinc-700/50">All Outcomes</SelectItem>
            <SelectItem value="booked appointment" className="text-white hover:bg-zinc-700/50">Booked Appointment</SelectItem>
            <SelectItem value="qualified" className="text-white hover:bg-zinc-700/50">Qualified</SelectItem>
            <SelectItem value="not qualified" className="text-white hover:bg-zinc-700/50">Not Qualified</SelectItem>
            <SelectItem value="spam" className="text-white hover:bg-zinc-700/50">Spam</SelectItem>
            <SelectItem value="escalated" className="text-white hover:bg-zinc-700/50">Escalated</SelectItem>
            <SelectItem value="call dropped" className="text-white hover:bg-zinc-700/50">Call Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}