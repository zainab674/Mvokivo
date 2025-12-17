
import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Phone, Calendar } from "lucide-react";
import { useCallDataProcessor } from "./useCallDataProcessor";
import { RecentCallsTable } from "./RecentCallsTable";
import { CallPagination } from "./CallPagination";

interface RecentCallsProps {
  callLogs?: any[];
  isLoading: boolean;
}

export default function RecentCalls({ callLogs, isLoading }: RecentCallsProps) {
  // Process the calls data for displaying in the table
  const {
    currentCalls,
    totalPages,
    currentPage,
    handlePageChange
  } = useCallDataProcessor({
    callLogs: callLogs || [],
    itemsPerPage: 5
  });

  return (
    <Card className="bg-card/50 border-border backdrop-blur-xl relative overflow-hidden group">
      {/* Decorative gradient */}
      <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl -z-10 group-hover:bg-indigo-500/10 transition-colors" />

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div className="space-y-1">
          <CardTitle className="text-xl font-bold text-foreground flex items-center gap-2">
            <Phone className="h-5 w-5 text-indigo-400" />
            Recent Calls
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            A list of your most recent interactions.
          </CardDescription>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-secondary px-3 py-1 rounded-full border border-border">
          <Calendar className="h-4 w-4" />
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground space-y-4">
            <div className="relative">
              <div className="h-12 w-12 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            </div>
            <p className="text-sm">Loading call data...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <RecentCallsTable currentCalls={currentCalls} />
            <CallPagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
