import React, { useState, useEffect } from "react";
import DashboardLayout from "@/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CreditCard, Download, Calendar, Zap, Phone, MessageSquare, Users, Loader2, Clock } from "lucide-react";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { PlanChangeDialog } from "@/components/settings/billing/PlanChangeDialog";
import { BACKEND_URL } from "@/lib/api-config";

interface UsageItem {
  name: string;
  used: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
}

interface Invoice {
  id: string;
  date: string;
  amount: string;
  status: string;
  type?: 'credit' | 'debit';
  minutes?: number;
  description?: string;
}

export default function Billing() {
  const { user, getAccessToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [usage, setUsage] = useState<UsageItem[]>([]);
  const [currentPlan, setCurrentPlan] = useState<{
    name: string;
    price: string;
    period: string;
    status: string;
    nextBilling: string | null;
    payAsYouGo?: boolean;
  } | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [planConfigs, setPlanConfigs] = useState<Record<string, any>>({});
  const [minutesBalance, setMinutesBalance] = useState(0);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [isPlanChangeDialogOpen, setIsPlanChangeDialogOpen] = useState(false);

  const getUsagePercentage = (used: number, limit: number) => {
    if (limit === 0) return 0; // Unlimited
    return Math.min((used / limit) * 100, 100);
  };

  const fetchBillingData = async () => {
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) {
        setLoading(false);
        return;
      }

      // 1. Fetch Usage & Plan Info
      const usagePromise = fetch(`${BACKEND_URL}/api/v1/billing/usage`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      // 2. Fetch Invoices
      const invoicesPromise = fetch(`${BACKEND_URL}/api/v1/billing/invoices?limit=20`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const [usageRes, invoicesRes] = await Promise.all([usagePromise, invoicesPromise]);

      if (usageRes.ok) {
        const usageData = await usageRes.json();
        if (usageData.success) {
          const { usage, plan } = usageData;

          // Set Plan
          setCurrentPlan({
            name: plan.name,
            price: `$${plan.price}`,
            period: plan.period,
            status: plan.status,
            nextBilling: plan.nextBilling,
            payAsYouGo: plan.payAsYouGo || false,
          });

          // Set Minutes
          setMinutesBalance(usage.minutesBalance);
          setMinutesUsed(usage.minutesUsed);

          // Set Usage
          setUsage([
            { name: "API Calls", used: usage.apiCalls.used, limit: usage.apiCalls.limit, icon: Zap },
            { name: "Text Messages", used: usage.textMessages.used, limit: usage.textMessages.limit, icon: MessageSquare },
          ]);
        }
      }

      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        if (invoicesData.success) {
          setInvoices(invoicesData.invoices);
        }
      }

    } catch (error) {
      console.error('Error fetching billing data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBillingData();
  }, [user?.id, getAccessToken]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!currentPlan) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-6 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Billing</h1>
            <p className="text-muted-foreground">Manage your subscription, usage, and billing information</p>
          </div>
          <Card>
            <CardContent className="pt-6">
              <p className="text-muted-foreground">Please sign in to view your billing information.</p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-2">Billing</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage your subscription, usage, and billing information</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Current Plan */}
          <div className="lg:col-span-2">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <CreditCard className="h-5 w-5" />
                  Current Plan
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Your subscription details and next billing date</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-foreground">{currentPlan.name}</h3>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      {currentPlan.price}/{currentPlan.period}
                    </p>
                  </div>
                  <Badge className="bg-success/10 text-success border-success/20">
                    {currentPlan?.status?.charAt(0).toUpperCase() + currentPlan?.status?.slice(1)}
                  </Badge>
                </div>

                <div className="space-y-4">
                  {currentPlan.nextBilling && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Next billing date</span>
                      <span className="text-foreground font-medium">{currentPlan.nextBilling}</span>
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-3 pt-2">
                    <Button variant="outline" onClick={() => setIsPlanChangeDialogOpen(true)} className="w-full sm:w-auto">
                      Change Plan
                    </Button>
                    <Button variant="outline" className="w-full sm:w-auto">Cancel Subscription</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Minutes Balance Card */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                <Clock className="h-5 w-5" />
                Minutes Balance
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">Your available call minutes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Available</span>
                  <span className="text-xl sm:text-2xl font-bold text-foreground">
                    {minutesBalance.toLocaleString()}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Used this month</span>
                  <span className="text-foreground font-medium">
                    {minutesUsed.toLocaleString()}
                  </span>
                </div>
              </div>



              {!currentPlan?.payAsYouGo && (
                <p className="text-[10px] sm:text-xs text-muted-foreground text-center">
                  Minutes are included with your {currentPlan?.name} plan
                </p>
              )}
            </CardContent>
          </Card>

          {/* Usage Overview */}
          <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-4 sm:p-6">
              <CardTitle className="text-lg sm:text-xl">Usage This Month</CardTitle>
              <CardDescription className="text-xs sm:text-sm">Current usage across all services</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-4 sm:p-6">
              {usage.length === 0 ? (
                <p className="text-sm text-muted-foreground">No usage data available</p>
              ) : (
                usage.map((item) => {
                  const IconComponent = item.icon;
                  const percentage = getUsagePercentage(item.used, item.limit === Infinity ? 0 : item.limit);
                  const limitDisplay = item.limit === Infinity ? 'Unlimited' : item.limit.toLocaleString();
                  return (
                    <div key={item.name} className="space-y-2">
                      <div className="flex items-center justify-between text-xs sm:text-sm">
                        <div className="flex items-center gap-2">
                          <IconComponent className="h-4 w-4 text-muted-foreground" />
                          <span className="text-foreground">{item.name}</span>
                        </div>
                        <span className="text-muted-foreground">
                          {item.used.toLocaleString()} / {limitDisplay}
                        </span>
                      </div>
                      {item.limit !== Infinity && (
                        <Progress
                          value={percentage}
                          className="h-1.5 sm:h-2"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          {/* Billing History */}
          <div className="lg:col-span-3">
            <Card className="border-border/40 bg-card/50 backdrop-blur-sm">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                  <Calendar className="h-5 w-5" />
                  Billing History
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Download invoices and view payment history</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                {invoices.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4">No invoices available</p>
                ) : (
                  <div className="space-y-3">
                    {invoices.map((invoice) => {
                      const amountStr = String(invoice.amount || '');
                      const isDebit = invoice.type === 'debit' || amountStr.startsWith('-');
                      const isCredit = invoice.type === 'credit' || (!invoice.type && !isDebit);

                      return (
                        <div key={invoice.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 rounded-lg bg-background/50 border border-border/30 gap-4 sm:gap-2">
                          <div className="flex items-start gap-4">
                            <div className="flex-1">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <p className="font-medium text-foreground text-sm sm:text-base">{invoice.id}</p>
                                {isDebit && (
                                  <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px]">
                                    Debit
                                  </Badge>
                                )}
                                {isCredit && (
                                  <Badge variant="outline" className="bg-success/10 text-success border-success/20 text-[10px]">
                                    Credit
                                  </Badge>
                                )}
                              </div>
                              <p className="text-xs sm:text-sm text-muted-foreground">{invoice.date}</p>
                              {invoice.description && (
                                <p className="text-[10px] sm:text-xs text-muted-foreground mt-1 line-clamp-1">{invoice.description}</p>
                              )}
                              {invoice.minutes && (
                                <p className="text-[10px] sm:text-xs text-muted-foreground">{invoice.minutes.toLocaleString()} minutes</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 border-t sm:border-t-0 pt-3 sm:pt-0">
                            <div className="text-right">
                              <p className={`font-semibold text-sm sm:text-base ${isDebit ? 'text-destructive' : 'text-foreground'}`}>
                                {invoice.amount}
                              </p>
                              <Badge
                                variant="outline"
                                className="bg-success/10 text-success border-success/20 text-[10px] h-5 mt-1"
                              >
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                              </Badge>
                            </div>
                            <Button variant="ghost" size="sm" className="gap-2 h-8 px-2 sm:px-3">
                              <Download className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Download</span>
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>



        {/* Plan Change Dialog */}
        <PlanChangeDialog
          open={isPlanChangeDialogOpen}
          onOpenChange={setIsPlanChangeDialogOpen}
          currentPlan={currentPlan?.name || ""}
          currentMinutes={minutesBalance}
          onPlanChanged={() => {
            // Refresh all billing data after plan change
            fetchBillingData();
          }}
        />
      </div>
    </DashboardLayout>
  );
}