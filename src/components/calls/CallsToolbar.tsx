
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

interface CallsToolbarProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  resolutionFilter: string;
  onResolutionChange: (value: string) => void;
  dateRange: { from: Date; to: Date };
  onDateRangeChange: (range: { from: Date; to: Date }) => void;
}

export default function CallsToolbar({
  searchQuery,
  onSearchChange,
  resolutionFilter,
  onResolutionChange,
  dateRange,
  onDateRangeChange,
}: CallsToolbarProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 md:mb-[var(--space-2xl)]">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/70 z-10" />
        <Input
          placeholder="Search by customer name or phone..."
          className="pl-12 h-10 sm:h-12"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>

      <div className="w-full">
        <TimeRangeSelector onRangeChange={onDateRangeChange} />
      </div>

      <div className="md:col-span-2 lg:col-span-1">
        <Select value={resolutionFilter} onValueChange={onResolutionChange}>
          <SelectTrigger className="h-10 sm:h-12">
            <SelectValue placeholder="Call Outcome: All" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Outcomes</SelectItem>
            <SelectItem value="booked appointment">Booked Appointment</SelectItem>
            <SelectItem value="not qualified">Not Qualified</SelectItem>
            <SelectItem value="spam">Spam</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
            <SelectItem value="call dropped">Call Dropped</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
