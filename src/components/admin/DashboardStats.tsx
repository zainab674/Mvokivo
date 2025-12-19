import React from 'react';
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight } from 'lucide-react';

interface StatCardProps {
    title: string;
    value: string | number;
    change?: number;
    changeLabel?: string;
    icon?: React.ReactNode;
    trend?: 'up' | 'down';
    className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
    title,
    value,
    change,
    changeLabel,
    icon,
    trend,
    className = ''
}) => {
    const isPositive = trend === 'up' || (change && change > 0);

    return (
        <div className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5 p-6 ${className}`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                        <p className="text-sm font-medium text-gray-400 mb-1">{title}</p>
                        <h3 className="text-3xl font-bold text-white">{value}</h3>
                    </div>
                    {icon && (
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
                            {icon}
                        </div>
                    )}
                </div>

                {(change !== undefined || changeLabel) && (
                    <div className="flex items-center gap-2">
                        {change !== undefined && (
                            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${isPositive
                                ? 'bg-green-500/10 text-green-400'
                                : 'bg-red-500/10 text-red-400'
                                }`}>
                                {isPositive ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                    <ArrowDownRight className="w-3 h-3" />
                                )}
                                <span className="text-xs font-semibold">
                                    {Math.abs(change)}% {changeLabel || 'this month'}
                                </span>
                            </div>
                        )}
                        {changeLabel && change === undefined && (
                            <span className="text-xs text-gray-400">{changeLabel}</span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

interface DashboardStatsProps {
    stats: {
        totalUsers: number;
        activeUsers: number;
        totalAssistants: number;
        totalCalls: number;
        totalMinutesUsed: number;
        totalMinutesLimit: number;
        totalPlans: number;
        activePercentage: number;
    };
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
            <StatCard
                title="Total Users"
                value={stats.totalUsers}
                change={stats.activePercentage}
                changeLabel={`${stats.activeUsers} active`}
                trend="up"
                icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />}
                className="p-4 sm:p-5 lg:p-6"
            />

            <StatCard
                title="Voice Agents"
                value={stats.totalAssistants}
                changeLabel="Across all users"
                icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-purple-400" />}
                className="p-4 sm:p-5 lg:p-6"
            />

            <StatCard
                title="Total Calls"
                value={stats.totalCalls.toLocaleString()}
                changeLabel="All time"
                icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-green-400" />}
                className="p-4 sm:p-5 lg:p-6"
            />

            <StatCard
                title="Minutes Used"
                value={stats.totalMinutesUsed.toLocaleString()}
                change={stats.totalMinutesLimit > 0
                    ? Math.round((stats.totalMinutesUsed / stats.totalMinutesLimit) * 100)
                    : undefined
                }
                changeLabel={stats.totalMinutesLimit > 0
                    ? 'of allocated'
                    : 'Unlimited plans'
                }
                icon={<TrendingUp className="w-5 h-5 sm:w-6 sm:h-6 text-orange-400" />}
                className="p-4 sm:p-5 lg:p-6"
            />
        </div>
    );
};
