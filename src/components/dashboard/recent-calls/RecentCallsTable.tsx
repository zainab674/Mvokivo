
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ThemedDialog, ThemedDialogTrigger } from "@/components/ui/themed-dialog";
import { FileText, PhoneIncoming, PhoneOutgoing, Clock } from "lucide-react";
import { CallDialogContent } from "../calls/CallDialogContent";
import { cn } from "@/lib/utils";

interface RecentCallsTableProps {
  currentCalls: any[];
}

export function RecentCallsTable({ currentCalls }: RecentCallsTableProps) {
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status?.toLowerCase() || 'unknown';

    let styles = "bg-zinc-800 text-zinc-400 border-zinc-700"; // default

    if (['completed', 'qualified', 'booked_appointment', 'booked appointment'].includes(statusLower)) {
      styles = "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    } else if (['failed', 'dropped', 'spam', 'call dropped', 'not qualified'].includes(statusLower)) {
      styles = "bg-red-500/10 text-red-400 border-red-500/20";
    } else if (['no_response', 'no response'].includes(statusLower)) {
      styles = "bg-orange-500/10 text-orange-400 border-orange-500/20";
    } else if (['message_to_franchise', 'message'].includes(statusLower)) {
      styles = "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }

    return (
      <Badge variant="outline" className={cn("capitalize font-normal", styles)}>
        {status.replace(/_/g, " ")}
      </Badge>
    );
  };

  return (
    <div className="rounded-xl border border-white/5 overflow-hidden bg-black/20">
      <Table>
        <TableHeader className="bg-white/5">
          <TableRow className="border-white/5 hover:bg-white/5">
            <TableHead className="text-muted-foreground w-[30%]">Customer</TableHead>
            <TableHead className="text-muted-foreground">Date</TableHead>
            <TableHead className="text-muted-foreground">Duration</TableHead>
            <TableHead className="text-muted-foreground">Status</TableHead>
            <TableHead className="text-right text-muted-foreground">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {currentCalls.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-12 text-muted-foreground">
                <div className="flex flex-col items-center gap-2">
                  <PhoneIncoming className="h-8 w-8 opacity-20" />
                  <p>No calls found</p>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            currentCalls.map((call, index) => (
              <ThemedDialog key={call.id || index}>
                <TableRow className="border-white/5 hover:bg-white/5 transition-colors group">
                  <TableCell>
                    <ThemedDialogTrigger asChild>
                      <div className="flex flex-col cursor-pointer">
                        <span className="font-medium text-white group-hover:text-indigo-400 transition-colors">
                          {call.participant_identity || call.phoneNumber || 'Unknown'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {call.phone_number || call.phoneNumber || 'No number'}
                        </span>
                      </div>
                    </ThemedDialogTrigger>
                  </TableCell>
                  <TableCell className="text-zinc-300 text-sm">
                    {formatDateTime(call.start_time || call.created_at || call.date)}
                  </TableCell>
                  <TableCell className="text-zinc-300">
                    <div className="flex items-center gap-1.5 text-sm">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      {formatDuration(call.call_duration || call.duration || 0)}
                    </div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(call.call_status || call.status || 'completed')}
                  </TableCell>
                  <TableCell className="text-right">
                    <ThemedDialogTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-full hover:bg-indigo-500/20 hover:text-indigo-400">
                        <FileText size={16} />
                      </Button>
                    </ThemedDialogTrigger>
                  </TableCell>
                </TableRow>
                <CallDialogContent call={call} />
              </ThemedDialog>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}