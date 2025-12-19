import React from 'react';
import { MoreHorizontal, Eye, Edit, Trash2, Shield, TrendingUp, Phone, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SupportAccessDialog } from '@/components/admin/SupportAccessDialog';

interface User {
    id: string;
    name: string | null;
    contact: {
        email: string | null;
        phone: string | null;
        countryCode: string | null;
    } | null;
    email: string | null;
    phone: string | null;
    countryCode: string | null;
    role: string | null;
    is_active: boolean | null;
    created_on: string | null;
    updated_at: string | null;
    company: string | null;
    industry: string | null;
    plan?: string | null;
    minutes_limit?: number | null;
    minutes_used?: number | null;
    is_whitelabel?: boolean;
    slug_name?: string | null;
    tenant?: string | null;
}

interface UserStats {
    totalAssistants: number;
    totalCalls: number;
    totalHours: number;
    totalMessages: number;
    plan: string | null;
}

interface ModernUserTableProps {
    users: User[];
    allUserStats: Record<string, UserStats>;
    onViewUser: (user: User) => void;
    onEditUser: (user: User) => void;
    onDeleteUser: (user: User) => void;
    onSupportAccess: (sessionData: any) => void;
    formatMinutes: (minutes: number | null | undefined, plan: string | null | undefined) => string;
    getRemainingMinutes: (user: User) => string;
}

export const ModernUserTable: React.FC<ModernUserTableProps> = ({
    users,
    allUserStats,
    onViewUser,
    onEditUser,
    onDeleteUser,
    onSupportAccess,
    formatMinutes,
    getRemainingMinutes,
}) => {
    return (
        <div className="overflow-hidden rounded-xl bg-gradient-to-br from-[#1a1f2e] to-[#0f1419] border border-white/5">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-white/5">
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                User
                            </th>
                            <th className="px-6 py-4 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Plan
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Agents
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Calls
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Minutes
                            </th>
                            <th className="px-6 py-4 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Status
                            </th>
                            <th className="px-6 py-4 text-right text-xs font-semibold text-gray-400 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {users.map((user) => {
                            const stats = allUserStats[user.id] || {
                                totalAssistants: 0,
                                totalCalls: 0,
                                totalHours: 0,
                                totalMessages: 0,
                                plan: null
                            };

                            return (
                                <tr
                                    key={user.id}
                                    className="hover:bg-white/5 transition-colors group"
                                >
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-semibold">
                                                {(user.name || 'U')[0].toUpperCase()}
                                            </div>
                                            <div>
                                                <div className="text-sm font-semibold text-white">
                                                    {user.name || 'N/A'}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    {user.contact?.email || 'N/A'}
                                                </div>
                                                {user.slug_name && (
                                                    <div className="flex items-center gap-1 mt-1">
                                                        <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                                                            WL: {user.slug_name}
                                                        </Badge>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <Badge
                                            variant="outline"
                                            className="bg-purple-500/10 text-purple-400 border-purple-500/20 font-medium"
                                        >
                                            {stats.plan || user.plan || 'Free'}
                                        </Badge>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-lg font-bold text-blue-400">
                                                {stats.totalAssistants}
                                            </span>
                                            <span className="text-xs text-gray-500">agents</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <span className="text-lg font-bold text-green-400">
                                                {stats.totalCalls.toLocaleString()}
                                            </span>
                                            <span className="text-xs text-gray-500">calls</span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className="flex items-center gap-1">
                                                <Clock className="w-3 h-3 text-orange-400" />
                                                <span className="text-sm font-semibold text-white">
                                                    {user.minutes_used?.toLocaleString() || 0}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    / {formatMinutes(user.minutes_limit, user.plan)}
                                                </span>
                                            </div>
                                            <span className="text-xs text-emerald-400 font-medium">
                                                {getRemainingMinutes(user)} left
                                            </span>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex justify-center">
                                            <Badge
                                                variant={user.is_active ? 'default' : 'destructive'}
                                                className={user.is_active
                                                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                                                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }
                                            >
                                                {user.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </div>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="flex justify-end">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0 text-gray-400 hover:text-white hover:bg-white/10"
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent
                                                    align="end"
                                                    className="w-48 bg-[#1a1f2e] border-white/10"
                                                >
                                                    <DropdownMenuItem
                                                        onClick={() => onViewUser(user)}
                                                        className="text-gray-300 hover:text-white hover:bg-white/10"
                                                    >
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => onEditUser(user)}
                                                        className="text-gray-300 hover:text-white hover:bg-white/10"
                                                    >
                                                        <Edit className="mr-2 h-4 w-4" />
                                                        Edit User
                                                    </DropdownMenuItem>
                                                    <SupportAccessDialog
                                                        userId={user.id}
                                                        userName={user.name || 'Unknown User'}
                                                        userEmail={user.contact?.email || 'No email'}
                                                        onSupportAccess={onSupportAccess}
                                                    >
                                                        <DropdownMenuItem
                                                            disabled={user.role === 'admin'}
                                                            onSelect={(e) => e.preventDefault()}
                                                            className="text-gray-300 hover:text-white hover:bg-white/10"
                                                        >
                                                            <Shield className="mr-2 h-4 w-4" />
                                                            Support Access
                                                        </DropdownMenuItem>
                                                    </SupportAccessDialog>
                                                    <DropdownMenuItem
                                                        onClick={() => onDeleteUser(user)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="mr-2 h-4 w-4" />
                                                        Delete User
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
