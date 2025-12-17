
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart3 } from "lucide-react";
import CallVolumeChart from "./call-analytics/CallVolumeChart";
import { useCallVolumeData } from "./call-analytics/useCallVolumeData";

interface CallAnalyticsProps {
  dateRange?: {
    from: Date;
    to: Date;
    compareWith?: { from: Date; to: Date };
  };
  callLogs?: any[];
}

export default function CallAnalytics({ dateRange, callLogs = [] }: CallAnalyticsProps) {
  const chartData = useCallVolumeData({ dateRange, callLogs });

  return (
    <Card className="bg-card/50 border-border backdrop-blur-xl relative overflow-hidden h-full">
      <div className="absolute bottom-0 left-0 w-[400px] h-[300px] bg-indigo-500/5 rounded-full blur-3xl -z-10" />

      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-400">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-foreground">Call Trends</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Volume over time</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="h-[350px] pt-4 pl-0">
        <CallVolumeChart chartData={chartData} />
      </CardContent>
    </Card>
  );
}
