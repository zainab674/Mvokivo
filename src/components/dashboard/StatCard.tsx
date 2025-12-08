
import { cn } from "@/lib/utils";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

interface StatCardProps {
  title: React.ReactNode;
  value: React.ReactNode;
  icon: React.ReactNode;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export default function StatCard({
  title,
  value,
  icon,
  trend,
  className,
}: StatCardProps) {
  return (
    <div className={cn("relative p-2", className)}>
      <div className="flex flex-col gap-2">
        {/* Header: Icon + Title */}
        <div className="flex items-center gap-2 text-muted-foreground/80 mb-1">
          <div className="p-1.5 rounded-md bg-white/5 text-indigo-400">
            {icon}
          </div>
          <span className="text-xs font-semibold tracking-wider uppercase font-mono">
            {title}
          </span>
        </div>

        {/* Value */}
        <div className="flex items-baseline gap-3">
          <span className="text-3xl font-bold text-foreground font-mono tracking-tight shadow-glow-sm">
            {value}
          </span>

          {/* Trend moved next to value */}
          {trend && (
            <div className={cn(
              "flex items-center text-xs font-bold",
              trend.positive
                ? "text-emerald-400"
                : "text-red-400"
            )}>
              {trend.positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
              {trend.value}%
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
