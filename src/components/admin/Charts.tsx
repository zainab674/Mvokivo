import React from 'react';
import { BarChart3, Activity } from 'lucide-react';

interface ChartData {
    label: string;
    value: number;
}

interface SimpleBarChartProps {
    title: string;
    data: ChartData[];
    color?: string;
    height?: number;
}

export const SimpleBarChart: React.FC<SimpleBarChartProps> = ({
    title,
    data,
    color = '#3b82f6',
    height = 200
}) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5 p-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <BarChart3 className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-end justify-between gap-2" style={{ height: `${height}px` }}>
                    {data.map((item, index) => {
                        const barHeight = (item.value / maxValue) * 100;
                        return (
                            <div key={index} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full flex items-end justify-center" style={{ height: '100%' }}>
                                    <div
                                        className="w-full rounded-t-lg bg-gradient-to-t from-blue-500 to-cyan-400 transition-all duration-300 hover:opacity-80 relative group"
                                        style={{ height: `${barHeight}%`, minHeight: '4px' }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                            {item.value.toLocaleString()}
                                        </div>
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 mt-2">{item.label}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

interface DonutChartProps {
    title: string;
    data: { label: string; value: number; color: string }[];
    centerValue?: string;
    centerLabel?: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
    title,
    data,
    centerValue,
    centerLabel
}) => {
    const total = data.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5 p-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <Activity className="w-5 h-5 text-gray-400" />
                </div>

                <div className="flex items-center justify-between gap-8">
                    {/* Donut Chart */}
                    <div className="relative w-32 h-32">
                        <svg viewBox="0 0 100 100" className="transform -rotate-90">
                            {data.map((item, index) => {
                                const percentage = (item.value / total) * 100;
                                const previousPercentage = data
                                    .slice(0, index)
                                    .reduce((sum, d) => sum + (d.value / total) * 100, 0);
                                const circumference = 2 * Math.PI * 35;
                                const strokeDasharray = `${(percentage / 100) * circumference} ${circumference}`;
                                const strokeDashoffset = -((previousPercentage / 100) * circumference);

                                return (
                                    <circle
                                        key={index}
                                        cx="50"
                                        cy="50"
                                        r="35"
                                        fill="none"
                                        stroke={item.color}
                                        strokeWidth="12"
                                        strokeDasharray={strokeDasharray}
                                        strokeDashoffset={strokeDashoffset}
                                        className="transition-all duration-300"
                                    />
                                );
                            })}
                        </svg>
                        {centerValue && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-2xl font-bold text-white">{centerValue}</span>
                                {centerLabel && (
                                    <span className="text-xs text-gray-400">{centerLabel}</span>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-3">
                        {data.map((item, index) => (
                            <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-sm text-gray-300">{item.label}</span>
                                </div>
                                <span className="text-sm font-semibold text-white">
                                    {((item.value / total) * 100).toFixed(0)}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

interface LineChartProps {
    title: string;
    data: ChartData[];
    color?: string;
    height?: number;
}

export const LineChart: React.FC<LineChartProps> = ({
    title,
    data,
    color = '#3b82f6',
    height = 200
}) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    const minValue = Math.min(...data.map(d => d.value), 0);
    const range = maxValue - minValue || 1;

    const points = data.map((item, index) => {
        const x = (index / (data.length - 1)) * 100;
        const y = 100 - ((item.value - minValue) / range) * 100;
        return `${x},${y}`;
    }).join(' ');

    return (
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5 p-6">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-full blur-3xl" />

            <div className="relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-white">{title}</h3>
                    <Activity className="w-5 h-5 text-gray-400" />
                </div>

                <div style={{ height: `${height}px` }}>
                    <svg viewBox="0 0 100 100" className="w-full h-full" preserveAspectRatio="none">
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map((y) => (
                            <line
                                key={y}
                                x1="0"
                                y1={y}
                                x2="100"
                                y2={y}
                                stroke="rgba(255,255,255,0.05)"
                                strokeWidth="0.5"
                            />
                        ))}

                        {/* Area under the line */}
                        <polygon
                            points={`0,100 ${points} 100,100`}
                            fill="url(#gradient)"
                            opacity="0.2"
                        />

                        {/* Line */}
                        <polyline
                            points={points}
                            fill="none"
                            stroke={color}
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor={color} stopOpacity="0.8" />
                                <stop offset="100%" stopColor={color} stopOpacity="0" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                <div className="flex items-center justify-between mt-4">
                    {data.map((item, index) => (
                        <span key={index} className="text-xs text-gray-400">
                            {item.label}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
};
