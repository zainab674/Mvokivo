
import {
  PhoneCall,
  Clock,
  CalendarCheck,
  BarChart2,
  CheckCircle2,
  TrendingUp,
  UserCheck
} from "lucide-react";
import StatCard from "@/components/dashboard/StatCard";
import { useBusinessUseCase } from "@/components/BusinessUseCaseProvider";

interface DashboardStatsProps {
  totalCalls: number;
  avgDuration: number;
  appointments: number;
  bookingRate: number;
  successfulTransfers: number;
}

export function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export default function DashboardStats({
  totalCalls,
  avgDuration,
  appointments,
  bookingRate,
  successfulTransfers
}: DashboardStatsProps) {
  const { config } = useBusinessUseCase();

  // Icon mapping for dynamic metrics using Lucide icons
  const iconMap: Record<string, any> = {
    Phone: PhoneCall,
    Timer: Clock,
    Calendar: CalendarCheck,
    ChartLineUp: TrendingUp,
    CheckCircle: CheckCircle2,
    Users: UserCheck,
    // Add default fallbacks
    default: BarChart2
  };

  // Value formatting function
  const formatValue = (value: number, format: string) => {
    switch (format) {
      case "duration":
        return formatDuration(value);
      case "percentage":
        return `${value}%`;
      case "currency":
        return `$${value.toLocaleString()}`;
      default:
        return value.toString();
    }
  };

  return (
    <div className="w-full">
      {/* We use a single container for the strip of stats, or just open grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12 relative">
        {/* Optional: Add vertical dividers between items in larger screens if desired, or keep it clean */}
        {config.metrics.map((metric, index) => {
          const IconComponent = iconMap[metric.icon] || iconMap.default;
          let value: number;

          // Map the data based on metric key
          switch (metric.key) {
            case "totalCalls":
              value = totalCalls;
              break;
            case "avgDuration":
              value = avgDuration;
              break;
            case "appointments":
            case "resolved":
            case "interviews":
            case "orders":
            case "successful":
              value = appointments;
              break;
            case "bookingRate":
            case "resolutionRate":
            case "conversionRate":
            case "successRate":
              value = bookingRate;
              break;
            case "successfulTransfers":
            case "escalations":
            case "referrals":
            case "transfers":
              value = successfulTransfers;
              break;
            default:
              value = 0;
          }

          return (
            <div key={metric.key} className="relative">
              {/* Divider for every item except the last one, visible on large screens */}
              {index !== config.metrics.length - 1 && (
                <div className="hidden lg:block absolute right-[-24px] top-1/2 -translate-y-1/2 h-8 w-px bg-white/10" />
              )}

              <StatCard
                title={metric.label}
                value={formatValue(value, metric.format)}
                icon={<IconComponent size={16} />}
                trend={{ value: 12 + index, positive: true }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
