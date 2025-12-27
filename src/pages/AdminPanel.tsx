import React, { useState, useEffect, useMemo } from 'react';
import { PLAN_CONFIGS, getPlanConfig, getPlanConfigs, invalidatePlanConfigsCache, type PlanConfig } from "@/lib/plan-config";
import { getAccessToken } from '@/lib/auth';
import { AdminService, type AdminUser } from '@/lib/adminService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MoreHorizontal, Search, Edit, Trash2, Eye, Shield, Users, CreditCard, Clock, Activity, TrendingUp, Settings, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/SupportAccessAuthContext';
import DashboardLayout from '@/layout/DashboardLayout';
import { ThemeContainer, ThemeSection, ThemeCard } from '@/components/theme';
import { SupportAccessDialog } from '@/components/admin/SupportAccessDialog';
import { SupportAccessBanner } from '@/components/admin/SupportAccessBanner';
import { ActiveSupportSessions } from '@/components/admin/ActiveSupportSessions';
import { DashboardStats } from '@/components/admin/DashboardStats';
import { SimpleBarChart, DonutChart, LineChart } from '@/components/admin/Charts';
import { ModernUserTable } from '@/components/admin/ModernUserTable';
import { BACKEND_URL } from "@/lib/api-config";

interface UserStats {
  totalAssistants: number;
  totalCalls: number;
  totalHours: number;
  totalMessages: number;
  plan: string | null;
}



const AdminPanel = () => {
  const { user, isImpersonating, exitImpersonation, activeSupportSession: contextActiveSupportSession, startSupportAccess } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [planSearchTerm, setPlanSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isViewUserOpen, setIsViewUserOpen] = useState(false);
  const [isDeleteUserOpen, setIsDeleteUserOpen] = useState(false);
  const [editUserData, setEditUserData] = useState<Partial<AdminUser>>({});
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [allUserStats, setAllUserStats] = useState<Record<string, UserStats>>({});
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [planDialogUser, setPlanDialogUser] = useState<AdminUser | null>(null);
  const [planDialogPlan, setPlanDialogPlan] = useState<string>("free");
  const [planDialogLoading, setPlanDialogLoading] = useState(false);

  // Plan configuration management state
  const [planConfigs, setPlanConfigs] = useState<Record<string, PlanConfig>>({});
  const [loadingPlanConfigs, setLoadingPlanConfigs] = useState(false);
  const [editingPlanKey, setEditingPlanKey] = useState<string | null>(null);
  const [editPlanData, setEditPlanData] = useState<Partial<PlanConfig>>({});
  const [isEditPlanOpen, setIsEditPlanOpen] = useState(false);

  const [deletingPlanKey, setDeletingPlanKey] = useState<string | null>(null);
  const [isDeletePlanOpen, setIsDeletePlanOpen] = useState(false);

  // Lemon Squeezy Config State
  const [lsConfig, setLsConfig] = useState({
    api_key: '',
    store_id: '',
    webhook_secret: ''
  });
  const [loadingLsConfig, setLoadingLsConfig] = useState(false);
  const [savingLsConfig, setSavingLsConfig] = useState(false);


  // Check if current admin is a whitelabel admin based on hostname
  const [isWhitelabelAdmin, setIsWhitelabelAdmin] = useState<boolean>(false);

  // Detect if we're on a whitelabel domain
  useEffect(() => {
    const hostname = window.location.hostname;
    // Main domain is just "localhost" or "127.0.0.1" without any subdomain
    // Whitelabel domains have subdomains like "gomgom.localhost" or "tenant1.localhost"
    const parts = hostname.split('.');
    const isMainDomain = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('127.0.0.1:');
    setIsWhitelabelAdmin(!isMainDomain);
  }, []);

  const formatPlanName = (plan?: string | null) => {
    if (!plan) return 'Free';
    return plan.charAt(0).toUpperCase() + plan.slice(1);
  };

  const formatMinutes = (minutes: number | null | undefined, plan: string | null | undefined) => {
    if (minutes === 0 || minutes === null || minutes === undefined) return 'Unlimited';
    return `${minutes.toLocaleString()} min`;
  };

  const getRemainingMinutes = (user: AdminUser) => {
    if (user.minutes_limit === 0 || user.minutes_limit === null || user.minutes_limit === undefined) return 'Unlimited';
    const used = user.minutes_used || 0;
    const remaining = Math.max(0, user.minutes_limit - used);
    return `${remaining.toLocaleString()} min`;
  };

  const getUsageStatus = (user: AdminUser) => {
    if (user.minutes_limit === 0 || user.minutes_limit === null || user.minutes_limit === undefined) return 'Unlimited';

    const used = user.minutes_used || 0;
    const limit = user.minutes_limit;

    if (used >= limit) return 'Exceeded';

    const percentage = used / limit;
    if (percentage >= 0.9) return 'Critical';
    if (percentage >= 0.75) return 'Warning';

    return 'OK';
  };

  const getStatusBadgeClasses = (status: string) => {
    switch (status) {
      case 'Exceeded':
        return 'bg-destructive/15 text-destructive border-destructive/20';
      case 'Critical':
        return 'bg-orange-500/15 text-orange-500 border-orange-500/20';
      case 'Warning':
        return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/20';
      case 'Unlimited':
        return 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20';
      case 'OK':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      default:
        return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    }
  };
  const openPlanDialog = (user: AdminUser) => {
    setPlanDialogUser(user);
    const userPlan = user.plan || "free";
    setPlanDialogPlan(userPlan);
    setPlanDialogOpen(true);
  };

  const handlePlanSave = async () => {
    if (!planDialogUser) return;
    setPlanDialogLoading(true);
    try {
      await AdminService.updateUser(planDialogUser.id, { plan: planDialogPlan });
      toast.success(`Updated plan for ${planDialogUser.name || planDialogUser.contact?.email || 'user'}`);
      setPlanDialogOpen(false);
      setPlanDialogUser(null);
      await fetchUsers();
    } catch (error: any) {
      console.error("Error updating plan:", error);
      toast.error(error?.message || "Failed to update plan");
    } finally {
      setPlanDialogLoading(false);
    }
  };

  // Support Access state
  const [activeSupportSession, setActiveSupportSession] = useState<any>(null);
  const [showActiveSessions, setShowActiveSessions] = useState(false);

  // Check if current user is admin OR if we're in a support access session
  const isAdmin = user?.role === 'admin' || contextActiveSupportSession;

  // Debug logging
  console.log('AdminPanel Debug:', {
    userRole: user?.role,
    contextActiveSupportSession: contextActiveSupportSession,
    isAdmin: isAdmin,
    isImpersonating: isImpersonating
  });

  useEffect(() => {
    if (!isAdmin) {
      toast.error('Access denied. Admin privileges required.');
      return;
    }
    fetchUsers();
    fetchPlanConfigs();
    fetchLemonSqueezyConfig();
  }, [isAdmin, user?.id]);

  const fetchLemonSqueezyConfig = async () => {
    try {
      setLoadingLsConfig(true);
      const token = getAccessToken();
      const response = await fetch(`${BACKEND_URL}/api/v1/admin/lemonsqueezy`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const result = await response.json();
        if (result.success && result.data) {
          setLsConfig(result.data);
        }
      }
    } catch (error) {
      console.error('Error fetching LS config:', error);
      toast.error('Failed to load Lemon Squeezy config');
    } finally {
      setLoadingLsConfig(false);
    }
  };

  const handleSaveLemonSqueezyConfig = async () => {
    try {
      setSavingLsConfig(true);
      const token = getAccessToken();
      const response = await fetch(`${BACKEND_URL}/api/v1/admin/lemonsqueezy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(lsConfig)
      });

      if (!response.ok) {
        throw new Error('Failed to save configuration');
      }

      toast.success('Lemon Squeezy configuration saved successfully');
    } catch (error) {
      console.error('Error saving LS config:', error);
      toast.error('Failed to save configuration');
    } finally {
      setSavingLsConfig(false);
    }
  };

  // Fetch plan configurations from database
  const fetchPlanConfigs = async () => {
    try {
      setLoadingPlanConfigs(true);
      // Get current user's tenant to fetch appropriate plans
      let tenant: string | null = null;
      if (user) {
        tenant = (user as any).slug_name || null;
      }
      const configs = await getPlanConfigs(tenant);
      setPlanConfigs(configs);
    } catch (error: any) {
      console.error('Error fetching plan configs:', error);
      toast.error('Failed to load plan configurations');
    } finally {
      setLoadingPlanConfigs(false);
    }
  };


  // Open edit plan dialog
  const openEditPlanDialog = async (planKey: string | null) => {
    if (planKey) {
      // Editing existing plan
      const plan = planConfigs[planKey] || PLAN_CONFIGS[planKey];
      if (plan) {
        setEditingPlanKey(planKey);
        setEditPlanData({
          key: plan.key,
          name: plan.name,
          price: plan.price,
          minutes: plan.minutes,
          payAsYouGo: plan.payAsYouGo ?? false,
          features: [...plan.features],
          whitelabelEnabled: plan.whitelabelEnabled ?? false,
          variantId: plan.variantId,
          maxAssistants: plan.maxAssistants,
          maxEmailCampaigns: plan.maxEmailCampaigns,
          maxCallCampaigns: plan.maxCallCampaigns
        });
      }
    } else {
      // Creating new plan
      setEditingPlanKey(null);
      setEditPlanData({
        key: '',
        name: '',
        price: 0,
        minutes: undefined,
        payAsYouGo: false,
        features: [],
        whitelabelEnabled: false,
        variantId: '',
        maxAssistants: 0,
        maxEmailCampaigns: 0,
        maxCallCampaigns: 0
      });
    }

    setIsEditPlanOpen(true);
  };

  // Save plan configuration
  const handleSavePlan = async () => {
    // For new plans, use the key from editPlanData
    const planKey = editingPlanKey || editPlanData.key;

    if (!planKey) {
      toast.error('Plan key is required');
      return;
    }

    // Validate required fields for new plans
    if (!editingPlanKey) {
      if (!editPlanData.name?.trim()) {
        toast.error('Plan name is required');
        return;
      }
      if (editPlanData.price === undefined || editPlanData.price === null) {
        toast.error('Plan price is required');
        return;
      }
    }

    try {
      setLoadingPlanConfigs(true);
      const token = getAccessToken();
      // const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

      const payload = {
        plan_key: planKey,
        name: editPlanData.name,
        price: editPlanData.price,
        minutes: editPlanData.minutes !== undefined && editPlanData.minutes !== null ? Number(editPlanData.minutes) : undefined,
        pay_as_you_go: editPlanData.payAsYouGo ?? false,
        features: (editPlanData.features || []).filter(f => f.trim()),
        whitelabel_enabled: editPlanData.whitelabelEnabled,
        variant_id: editPlanData.variantId,
        max_assistants: editPlanData.maxAssistants,
        max_email_campaigns: editPlanData.maxEmailCampaigns,
        max_call_campaigns: editPlanData.maxCallCampaigns
      };

      const isUpdate = !!editingPlanKey;
      const url = isUpdate
        ? `${BACKEND_URL}/api/v1/plans/${planKey}`
        : `${BACKEND_URL}/api/v1/plans`;

      const response = await fetch(url, {
        method: isUpdate ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save plan');
      }

      // Invalidate cache and refetch
      invalidatePlanConfigsCache();
      await fetchPlanConfigs();

      const tenant = (user as any)?.slug_name;
      toast.success(isUpdate
        ? (tenant ? 'Your tenant plan updated successfully!' : 'Plan updated successfully!')
        : (tenant ? 'Your tenant plan created successfully!' : 'Plan created successfully!'));
      setIsEditPlanOpen(false);
    } catch (error: any) {
      console.error('Error saving plan:', error);
      toast.error(error?.message || 'Failed to save plan configuration');
    } finally {
      setLoadingPlanConfigs(false);
    }
  };

  // Delete plan configuration
  const handleDeletePlan = async () => {
    if (!deletingPlanKey) return;

    try {
      setLoadingPlanConfigs(true);
      const token = getAccessToken();

      const response = await fetch(`${BACKEND_URL}/api/v1/plans/${deletingPlanKey}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to delete plan');
      }

      // Invalidate cache and refetch
      invalidatePlanConfigsCache();
      await fetchPlanConfigs();

      const tenant = (user as any)?.slug_name;
      toast.success(tenant
        ? 'Your tenant plan deleted successfully!'
        : 'Plan deleted successfully!');
      setIsDeletePlanOpen(false);
      setDeletingPlanKey(null);
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      toast.error(error?.message || 'Failed to delete plan configuration');
    } finally {
      setLoadingPlanConfigs(false);
    }
  };

  useEffect(() => {
    const filtered = users.filter(user =>
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.contact?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.company?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchTerm]);

  const filteredPlanUsers = useMemo(() => {
    if (!planSearchTerm) return users;
    const term = planSearchTerm.toLowerCase();
    return users.filter(user =>
      user.name?.toLowerCase().includes(term) ||
      user.contact?.email?.toLowerCase().includes(term) ||
      user.plan?.toLowerCase().includes(term)
    );
  }, [users, planSearchTerm]);

  // Debug userStats changes
  useEffect(() => {
    console.log('🔄 userStats state changed:', userStats);
  }, [userStats]);

  // Auto-load user statistics when modal opens
  useEffect(() => {
    if (isViewUserOpen && selectedUser) {
      console.log('🔄 Modal opened, auto-loading stats for user:', selectedUser.id);
      fetchUserStats(selectedUser.id);
    }
  }, [isViewUserOpen, selectedUser]);

  // Reset userStats when modal closes
  useEffect(() => {
    if (!isViewUserOpen) {
      setUserStats(null);
      setLoadingStats(false);
    }
  }, [isViewUserOpen]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getAccessToken();

      const response = await fetch(`${BACKEND_URL}/api/v1/admin/users`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch users' }));
        throw new Error(errorData.error || 'Failed to fetch users');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUsers(result.data);
        // Fetch stats for all users
        await fetchAllUserStats(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch users');
      }
    } catch (error: any) {
      console.error('Error fetching users:', error);
      toast.error(error?.message || 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllUserStats = async (users: AdminUser[]) => {
    try {
      const token = getAccessToken();
      // const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000'; // Removed as per instruction

      // Get user IDs
      const userIds = users.map(u => u.id).join(',');

      const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/stats?userIds=${userIds}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setAllUserStats(result.data);
      }
    } catch (error) {
      console.error('Error fetching all user stats:', error);
      // Set empty stats on error
      const emptyStats: Record<string, UserStats> = {};
      users.forEach(user => {
        emptyStats[user.id] = {
          totalAssistants: 0,
          totalCalls: 0,
          totalHours: 0,
          totalMessages: 0,
          plan: user.plan || null
        };
      });
      setAllUserStats(emptyStats);
    }
  };

  const fetchUserStats = async (userId: string) => {
    try {
      setLoadingStats(true);
      console.log('🔍 Fetching stats for user:', userId);

      const token = getAccessToken();

      const response = await fetch(`${BACKEND_URL}/api/v1/admin/users/${userId}/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user stats');
      }

      const result = await response.json();

      if (result.success && result.data) {
        setUserStats(result.data);
      } else {
        // Set default stats
        setUserStats({
          totalAssistants: 0,
          totalCalls: 0,
          totalHours: 0,
          totalMessages: 0,
          plan: null
        });
      }
    } catch (error: any) {
      console.error('Error fetching user stats:', error);
      setUserStats({
        totalAssistants: 0,
        totalCalls: 0,
        totalHours: 0,
        totalMessages: 0,
        plan: null
      });
    } finally {
      setLoadingStats(false);
    }
  };


  const handleEditUser = async () => {
    if (!selectedUser) return;

    try {
      await AdminService.updateUser(selectedUser.id, editUserData);
      toast.success('User updated successfully');
      setIsEditUserOpen(false);
      setSelectedUser(null);
      setEditUserData({});
      fetchUsers();
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.message || 'Failed to update user');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await AdminService.deleteUser(selectedUser.id);
      toast.success('User and all associated data deleted successfully');
      setIsDeleteUserOpen(false);
      setSelectedUser(null);
      fetchUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.message || 'Failed to delete user');
    }
  };



  // Support Access handlers
  const handleSupportAccess = async (sessionData: any) => {
    try {
      // Use the startSupportAccess function from the context
      const result = await startSupportAccess(sessionData);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      console.error('Error starting support access:', error);
      toast.error('Failed to start support access');
    }
  };

  const handleEndSupportSession = async () => {
    if (!contextActiveSupportSession) return;

    try {
      const token = getAccessToken();
      if (!token) {
        toast.error('No valid session found. Please log in again.');
        return;
      }

      const response = await fetch(`${BACKEND_URL}/api/v1/support-access/support-sessions/${contextActiveSupportSession.id}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason: 'completed' }),
      });

      if (!response.ok) {
        throw new Error('Failed to end support session');
      }

      setActiveSupportSession(null);
      await exitImpersonation();
      toast.success('Support access session ended');
    } catch (error) {
      console.error('Error ending support session:', error);
      toast.error('Failed to end support session');
    }
  };

  const handleExitImpersonation = async () => {
    setActiveSupportSession(null);
    await exitImpersonation();
  };

  const handleSessionSelect = (session: any) => {
    setActiveSupportSession(session);
    // You could also start impersonation here if needed
  };

  const openEditDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setEditUserData({
      name: user.name,
      role: user.role,
      company: user.company,
      industry: user.industry,
      is_active: user.is_active
    });
    setIsEditUserOpen(true);
  };

  const openViewDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setIsViewUserOpen(true);
  };

  const openDeleteDialog = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDeleteUserOpen(true);
  };

  // Compute dashboard statistics
  const dashboardStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const totalAssistants = Object.values(allUserStats).reduce((sum, stats) => sum + stats.totalAssistants, 0);
    const totalCalls = Object.values(allUserStats).reduce((sum, stats) => sum + stats.totalCalls, 0);
    const totalMinutesUsed = users.reduce((sum, user) => sum + (user.minutes_used || 0), 0);
    const totalMinutesLimit = users.reduce((sum, user) => {
      if (user.minutes_limit === 0 || user.minutes_limit === null || user.minutes_limit === undefined) {
        return sum; // Skip unlimited
      }
      return sum + user.minutes_limit;
    }, 0);
    const totalPlans = Object.keys(planConfigs).length;

    return {
      totalUsers,
      activeUsers,
      totalAssistants,
      totalCalls,
      totalMinutesUsed,
      totalMinutesLimit,
      totalPlans,
      activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
    };
  }, [users, allUserStats, planConfigs]);

  if (!isAdmin) {
    return (
      <DashboardLayout>
        <ThemeContainer variant="base" className="min-h-screen flex items-center justify-center">
          <ThemeCard className="w-96">
            <CardHeader>
              <CardTitle className="text-center text-red-600">Access Denied</CardTitle>
              <CardDescription className="text-center">
                You need admin privileges to access this panel.
              </CardDescription>
            </CardHeader>
          </ThemeCard>
        </ThemeContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <ThemeContainer variant="base" className="min-h-screen no-hover-scaling">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="max-w-[1600px] mx-auto space-y-6 sm:space-y-8">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-2">
                  Admin Dashboard
                </h1>
                <p className="text-muted-foreground text-sm sm:text-base max-w-2xl">
                  Comprehensive system administration and user management
                </p>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                {!isImpersonating && (
                  <div className="w-full sm:w-auto">
                    <ActiveSupportSessions onSessionSelect={handleSessionSelect} />
                  </div>
                )}
              </div>
            </div>

            {/* Statistics Dashboard */}
            <DashboardStats stats={dashboardStats} />

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mt-4 sm:mt-6">
              <SimpleBarChart
                title="User Activity (Last 7 Days)"
                data={[
                  { label: 'Mon', value: Math.floor(Math.random() * 100) },
                  { label: 'Tue', value: Math.floor(Math.random() * 100) },
                  { label: 'Wed', value: Math.floor(Math.random() * 100) },
                  { label: 'Thu', value: Math.floor(Math.random() * 100) },
                  { label: 'Fri', value: Math.floor(Math.random() * 100) },
                  { label: 'Sat', value: Math.floor(Math.random() * 100) },
                  { label: 'Sun', value: Math.floor(Math.random() * 100) },
                ]}
              />

              <DonutChart
                title="Plan Distribution"
                data={[
                  { label: 'Free', value: users.filter(u => !u.plan || u.plan === 'free').length, color: '#3b82f6' },
                  { label: 'Pro', value: users.filter(u => u.plan === 'pro').length, color: '#8b5cf6' },
                  { label: 'Enterprise', value: users.filter(u => u.plan === 'enterprise').length, color: '#ec4899' },
                ]}
                centerValue={users.length.toString()}
                centerLabel="Total Users"
              />
            </div>

            {/* Main Content Tabs */}
            <Tabs defaultValue="users" className="w-full">
              <TabsList className="flex w-full overflow-x-auto custom-scrollbar lg:w-auto bg-muted/20 p-1 mb-6 h-auto sm:h-12 min-w-max">
                <TabsTrigger value="users" className="flex-1 lg:flex-none flex items-center gap-2 text-sm sm:text-base py-2 sm:py-0">
                  <Users className="h-4 w-4" />
                  Users Management
                </TabsTrigger>
                <TabsTrigger value="plans" className="flex-1 lg:flex-none flex items-center gap-2 text-sm sm:text-base py-2 sm:py-0">
                  <CreditCard className="h-4 w-4" />
                  Plans & Pricing
                </TabsTrigger>
                <TabsTrigger value="lemonsqueezy" className="flex-1 lg:flex-none flex items-center gap-2 text-sm sm:text-base py-2 sm:py-0">
                  <CreditCard className="h-4 w-4" />
                  Lemon Squeezy
                </TabsTrigger>
              </TabsList>

              <TabsContent value="users" className="mt-0 space-y-6">
                {/* Users Management Card */}
                <ThemeCard className="overflow-hidden shadow-xl border-border/20">
                  <CardHeader className="border-b border-border/40 bg-muted/20 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl sm:text-2xl font-bold">Users Management</CardTitle>
                        <CardDescription className="text-sm sm:text-base mt-1">
                          View, manage, and monitor all system users
                        </CardDescription>
                      </div>
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search users..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-9 w-full h-10 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {loading ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground font-medium">Fetching users...</p>
                        </div>
                      </div>
                    ) : filteredUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                          <Users className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-bold text-foreground mb-1">No matches found</p>
                        <p className="text-sm text-muted-foreground text-center">
                          {searchTerm ? 'No users match your current search terms.' : 'There are no registered users in the system yet.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar">
                        <ModernUserTable
                          users={filteredUsers}
                          allUserStats={allUserStats}
                          onViewUser={openViewDialog}
                          onEditUser={openEditDialog}
                          onDeleteUser={openDeleteDialog}
                          onSupportAccess={handleSupportAccess}
                          formatMinutes={formatMinutes}
                          getRemainingMinutes={getRemainingMinutes}
                        />
                      </div>
                    )}
                  </CardContent>
                </ThemeCard>
              </TabsContent>

              <TabsContent value="plans" className="mt-0 space-y-8">
                {/* Plan Configuration Management */}
                <ThemeCard className="overflow-hidden shadow-xl border-border/20">
                  <CardHeader className="border-b border-border/40 bg-muted/20 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl sm:text-2xl font-bold">Plan Configuration</CardTitle>
                        <CardDescription className="text-sm sm:text-base mt-1">
                          Manage subscription plans, pricing, and features
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2 w-full sm:w-auto">
                        <Button onClick={() => openEditPlanDialog(null)} className="h-10 px-4 rounded-xl flex-1 sm:flex-none">
                          <Settings className="mr-2 h-4 w-4" />
                          Add Plan
                        </Button>
                        <Button onClick={fetchPlanConfigs} variant="outline" className="h-10 px-4 rounded-xl flex-1 sm:flex-none">
                          Refresh
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6">
                    {loadingPlanConfigs ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground font-medium">Loading configs...</p>
                        </div>
                      </div>
                    ) : Object.values(planConfigs).length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-6 border-2 border-dashed border-border/40 rounded-3xl">
                        <div className="w-16 h-16 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                          <CreditCard className="h-8 w-8 text-primary/40" />
                        </div>
                        <p className="text-lg font-bold mb-2 text-center">No plans configured</p>
                        <p className="text-sm text-muted-foreground text-center mb-8 max-w-xs">
                          Create your first subscription plan to start accepting payments.
                        </p>
                        <Button onClick={() => openEditPlanDialog(null)} className="rounded-xl px-8 h-12 font-bold shadow-lg shadow-primary/20">
                          <Settings className="mr-2 h-5 w-5" />
                          Create First Plan
                        </Button>
                      </div>
                    ) : (
                      <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {Object.values(planConfigs).map((plan) => (
                          <Card key={plan.key} className="border border-border/40 bg-card/40 backdrop-blur-sm hover:border-primary/40 transition-all hover:shadow-lg hover:-translate-y-1 group rounded-2xl overflow-hidden">
                            <CardHeader className="pb-4 border-b border-border/10 bg-muted/5">
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <CardTitle className="text-lg sm:text-xl font-bold truncate">{plan.name}</CardTitle>
                                  <CardDescription className="text-[10px] font-mono opacity-60 uppercase tracking-tighter truncate">{plan.key}</CardDescription>
                                </div>
                                <div className="flex flex-col gap-1 shrink-0">
                                  {plan.whitelabelEnabled && (
                                    <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px] uppercase font-black px-1.5 h-4 tracking-widest leading-none">White</Badge>
                                  )}
                                  {plan.payAsYouGo && (
                                    <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20 text-[9px] uppercase font-black px-1.5 h-4 tracking-widest leading-none">PAYG</Badge>
                                  )}
                                </div>
                              </div>
                            </CardHeader>
                            <CardContent className="p-5 space-y-4">
                              <div className="flex justify-between items-baseline border-b border-border/5 pb-3">
                                <span className="text-xs font-black uppercase text-muted-foreground/40 tracking-widest">Price</span>
                                <p className="text-2xl font-black text-foreground">${plan.price}<span className="text-[10px] font-bold text-muted-foreground ml-1">/mo</span></p>
                              </div>
                              <div className="flex justify-between items-center border-b border-border/5 pb-3">
                                <span className="text-xs font-black uppercase text-muted-foreground/40 tracking-widest">Minutes</span>
                                <p className="text-sm font-bold text-foreground">
                                  {plan.payAsYouGo
                                    ? 'Unlimited'
                                    : (plan.minutes === undefined || plan.minutes === null || plan.minutes === 0 ? 'Unlimited' : `${plan.minutes.toLocaleString()}`)
                                  }
                                </p>
                              </div>
                              <div className="flex justify-between items-center border-b border-border/5 pb-3">
                                <span className="text-xs font-black uppercase text-muted-foreground/40 tracking-widest">Features</span>
                                <Badge variant="secondary" className="font-bold text-[10px] rounded-md h-5">{plan.features.length}</Badge>
                              </div>
                              <div className="flex gap-2 pt-2">
                                <Button
                                  onClick={() => openEditPlanDialog(plan.key)}
                                  variant="outline"
                                  className="flex-1 h-9 rounded-xl text-xs font-bold border-border/60 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-all"
                                >
                                  <Edit className="mr-1.5 h-3.5 w-3.5" />
                                  Edit
                                </Button>
                                <Button
                                  onClick={() => {
                                    setDeletingPlanKey(plan.key);
                                    setIsDeletePlanOpen(true);
                                  }}
                                  variant="ghost"
                                  size="icon"
                                  className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-xl transition-all"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </ThemeCard>


                {/* User Plans & Minutes */}
                <ThemeCard className="overflow-hidden shadow-xl border-border/20">
                  <CardHeader className="border-b border-border/40 bg-muted/20 p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                      <div>
                        <CardTitle className="text-xl sm:text-2xl font-bold">User Subscriptions</CardTitle>
                        <CardDescription className="text-sm sm:text-base mt-1">
                          Monitor user tiers and minute usage globally
                        </CardDescription>
                      </div>
                      <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search subscribers..."
                          value={planSearchTerm}
                          onChange={(e) => setPlanSearchTerm(e.target.value)}
                          className="pl-9 w-full h-10 rounded-xl"
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="p-0">
                    {filteredPlanUsers.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-20 px-6">
                        <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center mb-4">
                          <CreditCard className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <p className="text-lg font-bold text-foreground">No subscribers found</p>
                        <p className="text-sm text-muted-foreground text-center mt-1">
                          {planSearchTerm ? 'No users match your criteria.' : 'There are no active subscriptions.'}
                        </p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto custom-scrollbar">
                        <Table>
                          <TableHeader className="bg-muted/30">
                            <TableRow className="border-b border-border/40 hover:bg-transparent">
                              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 px-6 min-w-[200px]">User</TableHead>
                              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 px-6 min-w-[120px]">Plan</TableHead>
                              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 px-6 text-center whitespace-nowrap">Limit</TableHead>
                              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 px-6 text-center whitespace-nowrap">Used</TableHead>
                              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 px-6 text-center whitespace-nowrap">Remaining</TableHead>
                              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 px-6 min-w-[100px]">Status</TableHead>
                              <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 px-6 text-right">Control</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {filteredPlanUsers.map((user) => {
                              const status = getUsageStatus(user);
                              return (
                                <TableRow key={`plan-${user.id}`} className="border-b border-border/10 hover:bg-primary/5 transition-all group">
                                  <TableCell className="py-4 px-6">
                                    <div className="flex flex-col">
                                      <span className="font-bold text-foreground group-hover:text-primary transition-colors truncate max-w-[200px]">{user.name || 'Anonymous User'}</span>
                                      <span className="text-xs text-muted-foreground opacity-60 truncate max-w-[200px]">{user.contact?.email || 'No email provided'}</span>
                                    </div>
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    <Badge className="bg-primary/5 text-primary border-primary/10 font-bold uppercase text-[9px] tracking-widest rounded-md px-2 h-5">
                                      {formatPlanName(user.plan)}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 px-6 text-center">
                                    <span className="text-xs font-bold text-foreground">
                                      {formatMinutes(user.minutes_limit, user.plan)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-4 px-6 text-center">
                                    <span className="text-xs font-bold text-orange-500 bg-orange-500/5 px-2 py-0.5 rounded-md border border-orange-500/10">
                                      {user.minutes_used?.toLocaleString() || 0}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-4 px-6 text-center">
                                    <span className="text-xs font-bold text-emerald-500 bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10 whitespace-nowrap">
                                      {getRemainingMinutes(user)}
                                    </span>
                                  </TableCell>
                                  <TableCell className="py-4 px-6">
                                    <Badge className={`${getStatusBadgeClasses(status)} text-[9px] uppercase font-black tracking-widest border px-2 h-5`}>
                                      {status}
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="py-4 px-6 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => openPlanDialog(user)}
                                      className="h-8 rounded-lg text-[10px] font-black uppercase tracking-widest border-border/60 hover:bg-primary/5 hover:text-primary transition-all whitespace-nowrap px-3"
                                    >
                                      Adjust Plan
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </CardContent>
                </ThemeCard>
              </TabsContent>

              <TabsContent value="lemonsqueezy" className="mt-0 space-y-8">
                <ThemeCard className="overflow-hidden shadow-xl border-border/20">
                  <CardHeader className="border-b border-border/40 bg-muted/20 p-4 sm:p-6">
                    <CardTitle className="text-xl sm:text-2xl font-bold">Lemon Squeezy Configuration</CardTitle>
                    <CardDescription className="text-sm sm:text-base mt-1">
                      Configure your payment gateway settings from Lemon Squeezy.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 space-y-6">
                    {loadingLsConfig ? (
                      <div className="flex items-center justify-center py-20">
                        <div className="flex flex-col items-center gap-4">
                          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
                          <p className="text-sm text-muted-foreground font-medium">Loading config...</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="grid gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="ls-api-key">LEMON_SQUEEZY_API_KEY</Label>
                            <div className="relative">
                              <Input
                                id="ls-api-key"
                                type="password"
                                value={lsConfig.api_key}
                                onChange={(e) => setLsConfig({ ...lsConfig, api_key: e.target.value })}
                                placeholder="Enter your Lemon Squeezy API Key"
                                className="pr-10"
                              />
                              <Shield className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Used to authenticate API requests to Lemon Squeezy.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ls-store-id">LEMON_SQUEEZY_STORE_ID</Label>
                            <Input
                              id="ls-store-id"
                              value={lsConfig.store_id}
                              onChange={(e) => setLsConfig({ ...lsConfig, store_id: e.target.value })}
                              placeholder="e.g. 119851"
                            />
                            <p className="text-xs text-muted-foreground">
                              Your Store ID found in Lemon Squeezy Settings `Stores`.
                            </p>
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="ls-webhook-secret">LEMONSQUEEZY_WEBHOOK_SECRET</Label>
                            <div className="relative">
                              <Input
                                id="ls-webhook-secret"
                                type="password"
                                value={lsConfig.webhook_secret}
                                onChange={(e) => setLsConfig({ ...lsConfig, webhook_secret: e.target.value })}
                                placeholder="Enter Webhook Signing Secret"
                                className="pr-10"
                              />
                              <Shield className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            </div>
                            <p className="text-xs text-muted-foreground">
                              Secret used to verify webhooks from Lemon Squeezy (Settings `Webhooks`).
                            </p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-4">
                          <Button onClick={handleSaveLemonSqueezyConfig} disabled={savingLsConfig} className="bg-primary text-primary-foreground hover:bg-primary/90">
                            {savingLsConfig ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Saving...
                              </>
                            ) : (
                              'Save Configuration'
                            )}
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </ThemeCard>
              </TabsContent>
            </Tabs>

            {/* Edit User Dialog */}
            <Dialog open={isEditUserOpen} onOpenChange={setIsEditUserOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Edit User</DialogTitle>
                  <DialogDescription>
                    Update user information and permissions.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-name" className="text-right">Name</Label>
                    <Input
                      id="edit-name"
                      value={editUserData.name || ''}
                      onChange={(e) => setEditUserData({ ...editUserData, name: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-role" className="text-right">Role</Label>
                    <Select value={editUserData.role || ''} onValueChange={(value) => setEditUserData({ ...editUserData, role: value })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="user">User</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-company" className="text-right">Company</Label>
                    <Input
                      id="edit-company"
                      value={editUserData.company || ''}
                      onChange={(e) => setEditUserData({ ...editUserData, company: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-industry" className="text-right">Industry</Label>
                    <Input
                      id="edit-industry"
                      value={editUserData.industry || ''}
                      onChange={(e) => setEditUserData({ ...editUserData, industry: e.target.value })}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="edit-status" className="text-right">Status</Label>
                    <Select value={editUserData.is_active ? 'active' : 'inactive'} onValueChange={(value) => setEditUserData({ ...editUserData, is_active: value === 'active' })}>
                      <SelectTrigger className="col-span-3">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsEditUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleEditUser}>
                    Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* View User Dialog */}
            <Dialog open={isViewUserOpen} onOpenChange={(open) => {
              setIsViewUserOpen(open);
              if (open && selectedUser) {
                fetchUserStats(selectedUser.id);
              }
            }}>
              <DialogContent className="sm:max-w-[700px]">
                <DialogHeader>
                  <DialogTitle>User Details</DialogTitle>
                  <DialogDescription>
                    Complete information about the selected user.
                  </DialogDescription>
                </DialogHeader>
                {selectedUser && (
                  <div className="grid gap-6 py-4">
                    {/* Basic Information */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Basic Information</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Name</Label>
                          <p className="text-sm text-white">{selectedUser.name || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Email</Label>
                          <p className="text-sm text-white">{selectedUser.contact?.email || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Phone</Label>
                          <p className="text-sm text-white">{selectedUser.contact?.phone || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Role</Label>
                          <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                            {selectedUser.role || 'user'}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Company</Label>
                          <p className="text-sm text-white">{selectedUser.company || 'N/A'}</p>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Industry</Label>
                          <p className="text-sm text-white">{selectedUser.industry || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm font-medium">Status</Label>
                          <Badge variant={selectedUser.is_active ? 'default' : 'destructive'}>
                            {selectedUser.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div>
                          <Label className="text-sm font-medium">Created</Label>
                          <p className="text-sm text-white">
                            {selectedUser.created_on ? new Date(selectedUser.created_on).toLocaleString() : 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label className="text-sm font-medium">Last Updated</Label>
                        <p className="text-sm text-white">
                          {selectedUser.updated_at ? new Date(selectedUser.updated_at).toLocaleString() : 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* User Statistics */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-white">Usage Statistics</h3>
                      {loadingStats ? (
                        <div className="flex items-center justify-center py-8">
                          <div className="text-sm text-gray-400">Loading statistics...</div>
                        </div>
                      ) : userStats ? (
                        <div className="grid grid-cols-2 gap-4">
                          <div className="bg-gray-800/50 p-4 rounded-lg">
                            <Label className="text-sm font-medium text-blue-300">Total Assistants</Label>
                            <p className="text-2xl font-bold text-white">{userStats.totalAssistants}</p>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg">
                            <Label className="text-sm font-medium text-green-300">Total Calls</Label>
                            <p className="text-2xl font-bold text-white">{userStats.totalCalls}</p>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg">
                            <Label className="text-sm font-medium text-yellow-300">Total Hours</Label>
                            <p className="text-2xl font-bold text-white">{userStats.totalHours}</p>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg">
                            <Label className="text-sm font-medium text-purple-300">Total Messages</Label>
                            <p className="text-2xl font-bold text-white">{userStats.totalMessages}</p>
                          </div>
                          <div className="bg-gray-800/50 p-4 rounded-lg col-span-2">
                            <Label className="text-sm font-medium text-orange-300">Current Plan</Label>
                            <Badge variant="outline" className="text-lg px-3 py-1">
                              {userStats.plan || 'Free'}
                            </Badge>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-sm text-red-400">Failed to load statistics</div>
                          <div className="text-xs text-gray-500">
                            Debug info: loadingStats={loadingStats.toString()}, userStats={userStats ? 'exists' : 'null'}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => selectedUser && fetchUserStats(selectedUser.id)}
                            className="text-xs"
                          >
                            Retry Loading Stats
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsViewUserOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={isDeleteUserOpen} onOpenChange={setIsDeleteUserOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete User</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this user? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                {selectedUser && (
                  <div className="py-4">
                    <p className="text-sm text-white">
                      You are about to delete <strong>{selectedUser.name}</strong> ({selectedUser.contact?.email}).
                      This will permanently remove their account and all associated data.
                    </p>
                    <div className="mt-3 p-3 bg-red-900/20 border border-red-500/30 rounded-md">
                      <p className="text-sm text-red-200 font-medium">⚠️ Warning:</p>
                      <p className="text-sm text-red-200 mt-1">
                        This action will permanently delete ALL user data including:
                      </p>
                      <ul className="text-sm text-red-200 mt-2 ml-4 list-disc">
                        <li>Assistants and their configurations</li>
                        <li>Campaigns and call history</li>
                        <li>Contacts and contact lists</li>
                        <li>CSV files and uploaded data</li>
                        <li>SMS messages and history</li>
                        <li>Knowledge bases and documents</li>
                        <li>Calendar and WhatsApp integrations</li>
                        <li>Twilio credentials and settings</li>
                        <li>Workspace preferences</li>
                      </ul>
                      <p className="text-sm text-red-200 mt-2 font-medium">
                        This action cannot be undone!
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteUserOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeleteUser}>
                    Delete User
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Plan & Minutes Dialog */}
            <Dialog
              open={planDialogOpen}
              onOpenChange={(open) => {
                setPlanDialogOpen(open);
                if (!open) {
                  setPlanDialogUser(null);
                }
              }}
            >
              <DialogContent className="sm:max-w-[480px]">
                <DialogHeader>
                  <DialogTitle>Assign Plan</DialogTitle>
                  <DialogDescription>
                    Update the subscription plan for this user. Minutes are now purchased separately.
                  </DialogDescription>
                </DialogHeader>
                {planDialogUser && (
                  <div className="space-y-4">
                    <div className="grid gap-2 rounded-lg border border-border/40 bg-muted/10 p-4">
                      <div className="text-sm text-muted-foreground">User</div>
                      <div className="text-lg font-medium text-foreground">{planDialogUser.name || planDialogUser.contact?.email || 'N/A'}</div>
                      <div className="text-xs text-muted-foreground">{planDialogUser.contact?.email || 'No email on file'}</div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Plan</Label>
                      <Select
                        value={planDialogPlan}
                        onValueChange={setPlanDialogPlan}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select plan" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.values(planConfigs).length > 0 ? (
                            Object.values(planConfigs).map((plan: any) => (
                              <SelectItem key={plan.key} value={plan.key}>
                                {plan.name} (${plan.price}/month)
                              </SelectItem>
                            ))
                          ) : (
                            Object.values(PLAN_CONFIGS).map((plan: any) => (
                              <SelectItem key={plan.key} value={plan.key}>
                                {plan.name} (${plan.price}/month)
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Minutes are purchased separately via the Billing page.
                      </p>
                    </div>
                  </div>
                )}
                <DialogFooter className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handlePlanSave} disabled={planDialogLoading}>
                    {planDialogLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Plan Configuration Dialog */}
            <Dialog open={isEditPlanOpen} onOpenChange={setIsEditPlanOpen}>
              <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editingPlanKey ? 'Edit' : 'Add'} Plan Configuration</DialogTitle>
                  <DialogDescription>
                    {user?.slug_name
                      ? `Update plan price and features for your whitelabel tenant. Minutes are sold separately. Changes will apply to all new subscriptions on your tenant.`
                      : `Update plan price and features. Minutes are sold separately. Changes will apply to all new subscriptions.`}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  {editingPlanKey ? (
                    <div className="grid gap-2 rounded-lg border border-border/40 bg-muted/10 p-4">
                      <div className="text-sm text-muted-foreground">Plan Key</div>
                      <div className="text-lg font-medium text-foreground">{editingPlanKey}</div>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="new-plan-key">Plan Key *</Label>
                      <Input
                        id="new-plan-key"
                        value={editPlanData.key || ''}
                        onChange={(e) => setEditPlanData({ ...editPlanData, key: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') })}
                        placeholder="e.g., starter, professional, enterprise"
                      />
                      <p className="text-xs text-muted-foreground">
                        Unique identifier for this plan (lowercase, alphanumeric, hyphens, and underscores only)
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="edit-plan-name">Plan Name *</Label>
                    <Input
                      id="edit-plan-name"
                      value={editPlanData.name || ''}
                      onChange={(e) => setEditPlanData({ ...editPlanData, name: e.target.value })}
                      placeholder="e.g., Starter, Professional"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-plan-price">Price (USD/month) *</Label>
                    <Input
                      id="edit-plan-price"
                      type="number"
                      min={0}
                      step="0.01"
                      value={editPlanData.price ?? ''}
                      onChange={(e) => setEditPlanData({ ...editPlanData, price: Number(e.target.value) })}
                      placeholder="0.00"
                    />
                    <p className="text-xs text-muted-foreground">
                      Monthly subscription price. Minutes are purchased separately.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-plan-minutes">Included Minutes (per month)</Label>
                    <Input
                      id="edit-plan-minutes"
                      type="number"
                      min={0}
                      step="1"
                      value={editPlanData.minutes ?? ''}
                      onChange={(e) => setEditPlanData({ ...editPlanData, minutes: e.target.value ? Number(e.target.value) : undefined })}
                      placeholder="Leave empty for unlimited"
                    />
                    <p className="text-xs text-muted-foreground">
                      Number of included minutes per month. Leave empty or set to 0 for unlimited. Additional minutes can be purchased separately.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="max-assistants">Max Assistants</Label>
                      <Input
                        id="max-assistants"
                        type="number"
                        min={0}
                        value={editPlanData.maxAssistants ?? ''}
                        onChange={(e) => setEditPlanData({ ...editPlanData, maxAssistants: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-email-campaigns">Max Email Camp.</Label>
                      <Input
                        id="max-email-campaigns"
                        type="number"
                        min={0}
                        value={editPlanData.maxEmailCampaigns ?? ''}
                        onChange={(e) => setEditPlanData({ ...editPlanData, maxEmailCampaigns: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Unlimited"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="max-call-campaigns">Max Call Camp.</Label>
                      <Input
                        id="max-call-campaigns"
                        type="number"
                        min={0}
                        value={editPlanData.maxCallCampaigns ?? ''}
                        onChange={(e) => setEditPlanData({ ...editPlanData, maxCallCampaigns: e.target.value ? Number(e.target.value) : undefined })}
                        placeholder="Unlimited"
                      />
                    </div>
                  </div>
                  <p className="text-[10px] text-muted-foreground -mt-2">
                    Set to 0 or leave empty for unlimited.
                  </p>

                  <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 p-4">
                    <div>
                      <p className="text-sm font-medium text-foreground">Pay As You Go</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        If enabled, users must purchase minutes separately. Included minutes will be ignored.
                      </p>
                    </div>
                    <Switch
                      checked={!!editPlanData.payAsYouGo}
                      onCheckedChange={(checked) => setEditPlanData({ ...editPlanData, payAsYouGo: checked })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-variant-id">Lemon Squeezy Variant ID</Label>
                    <Input
                      id="edit-variant-id"
                      value={editPlanData.variantId || ''}
                      onChange={(e) => setEditPlanData({ ...editPlanData, variantId: e.target.value })}
                      placeholder="e.g., 123456"
                    />
                    <p className="text-xs text-muted-foreground">
                      The Variant ID from Lemon Squeezy for this plan's checkout.
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="edit-plan-features">Features</Label>
                    <Textarea
                      id="edit-plan-features"
                      value={(editPlanData.features || []).join('\n')}
                      onChange={(e) => {
                        const features = e.target.value.split('\n');
                        setEditPlanData({ ...editPlanData, features });
                      }}
                      placeholder="Enter one feature per line"
                      rows={6}
                      className="font-mono text-sm"
                    />
                    <p className="text-xs text-muted-foreground">
                      Enter one feature per line. Each line will be a separate feature.
                    </p>
                  </div>

                  {/* Only show whitelabel toggle for main tenant admins */}
                  {!isWhitelabelAdmin && (
                    <div className="flex items-center justify-between rounded-lg border border-border/40 bg-muted/10 p-4">
                      <div>
                        <p className="text-sm font-medium text-foreground">Includes Whitelabel</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Only subscribers on plans with Whitelabel enabled can access the branding settings.
                        </p>
                      </div>
                      <Switch
                        checked={!!editPlanData.whitelabelEnabled}
                        onCheckedChange={(checked) => setEditPlanData({ ...editPlanData, whitelabelEnabled: checked })}
                      />
                    </div>
                  )}
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {
                    setIsEditPlanOpen(false);
                  }}>
                    Cancel
                  </Button>
                  <Button onClick={handleSavePlan} disabled={loadingPlanConfigs}>
                    {loadingPlanConfigs ? 'Saving...' : 'Save Plan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Delete Plan Dialog */}
            <Dialog open={isDeletePlanOpen} onOpenChange={setIsDeletePlanOpen}>
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Delete Plan</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this plan? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    You are about to delete the plan <strong>{deletingPlanKey}</strong>.
                    Users currently on this plan will not be affected immediately, but they won't be able to switch back to it if they change plans.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeletePlanOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDeletePlan} disabled={loadingPlanConfigs}>
                    {loadingPlanConfigs ? 'Deleting...' : 'Delete Plan'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

          </div>
        </div>
      </ThemeContainer>
    </DashboardLayout>
  );
};

export default AdminPanel;
