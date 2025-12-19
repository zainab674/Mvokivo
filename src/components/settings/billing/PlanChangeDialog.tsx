import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, Check, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { getPlanConfigs } from "@/lib/plan-config";
import { extractTenantFromHostname } from "@/lib/tenant-utils";

interface PlanChangeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    currentPlan: string;
    currentMinutes: number;
    onPlanChanged: () => void;
}

interface Plan {
    key: string;
    name: string;
    price: number;
    minutes?: number;
    payAsYouGo?: boolean;
    features: string[];
}

export function PlanChangeDialog({
    open,
    onOpenChange,
    currentPlan,
    currentMinutes,
    onPlanChanged,
}: PlanChangeDialogProps) {
    const { toast } = useToast();
    const { getAccessToken } = useAuth();
    const [step, setStep] = useState<"warning" | "selection">("warning");
    const [plans, setPlans] = useState<Plan[]>([]);
    const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadingPlans, setLoadingPlans] = useState(true);

    useEffect(() => {
        if (open) {
            fetchPlans();
        }
    }, [open]);

    const fetchPlans = async () => {
        try {
            setLoadingPlans(true);
            const tenant = extractTenantFromHostname();
            const tenantSlug = tenant === "main" ? null : tenant;
            const planConfigs = await getPlanConfigs(tenantSlug);

            const plansList = Object.values(planConfigs)
                .filter((plan) => plan.key !== "free" && plan.key !== currentPlan.toLowerCase())
                .map((plan) => ({
                    key: plan.key,
                    name: plan.name,
                    price: plan.price,
                    minutes: plan.minutes,
                    payAsYouGo: plan.payAsYouGo,
                    features: plan.features,
                }));

            setPlans(plansList);
        } catch (error) {
            console.error("Error fetching plans:", error);
            toast({
                title: "Error",
                description: "Failed to load available plans",
                variant: "destructive",
            });
        } finally {
            setLoadingPlans(false);
        }
    };

    const handleProceed = () => {
        setStep("selection");
    };

    const handleChangePlan = async () => {
        if (!selectedPlan) {
            toast({
                title: "No plan selected",
                description: "Please select a plan to continue",
                variant: "destructive",
            });
            return;
        }

        try {
            setLoading(true);
            const token = await getAccessToken();
            if (!token) {
                throw new Error("Not authenticated");
            }

            const backendUrl = import.meta.env.VITE_BACKEND_URL || "";
            const response = await fetch(`${backendUrl}/api/v1/user/change-plan`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ newPlan: selectedPlan }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || "Failed to change plan");
            }

            toast({
                title: "Plan changed successfully! 🎉",
                description: `You are now on the ${plans.find((p) => p.key === selectedPlan)?.name
                    } plan with ${data.minutesAssigned || 0} minutes.`,
            });

            onPlanChanged();
            onOpenChange(false);
            setStep("warning");
            setSelectedPlan(null);
        } catch (error: any) {
            console.error("Error changing plan:", error);
            toast({
                title: "Failed to change plan",
                description: error.message || "Please try again",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        onOpenChange(false);
        setStep("warning");
        setSelectedPlan(null);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                {step === "warning" ? (
                    <>
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-amber-500" />
                                Change Plan Warning
                            </DialogTitle>
                            <DialogDescription>
                                Please read this important information before changing your plan
                            </DialogDescription>
                        </DialogHeader>

                        <Alert className="border-amber-500/50 bg-amber-500/10">
                            <AlertTriangle className="h-4 w-4 text-amber-500" />
                            <AlertDescription className="text-foreground">
                                <div className="space-y-2">
                                    <p className="font-semibold">Your current minutes will not roll over!</p>
                                    <p className="text-sm">
                                        You currently have <span className="font-bold">{currentMinutes}</span> minutes
                                        remaining on your <span className="font-bold">{currentPlan}</span> plan.
                                    </p>
                                    <p className="text-sm">
                                        When you change plans, your minutes balance will be reset to the new plan's
                                        allocation. Any unused minutes from your current plan will be lost.
                                    </p>
                                </div>
                            </AlertDescription>
                        </Alert>

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={handleCancel}>
                                Cancel
                            </Button>
                            <Button onClick={handleProceed}>
                                I Understand, Continue
                            </Button>
                        </DialogFooter>
                    </>
                ) : (
                    <>
                        <DialogHeader>
                            <DialogTitle>Select New Plan</DialogTitle>
                            <DialogDescription>
                                Choose a plan that best fits your needs
                            </DialogDescription>
                        </DialogHeader>

                        {loadingPlans ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : (
                            <div className="space-y-3 max-h-[400px] overflow-y-auto">
                                {plans.map((plan) => (
                                    <button
                                        key={plan.key}
                                        type="button"
                                        onClick={() => setSelectedPlan(plan.key)}
                                        className={`w-full p-4 text-left rounded-lg border-2 transition-all ${selectedPlan === plan.key
                                                ? "border-primary bg-primary/5"
                                                : "border-border hover:border-primary/50"
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <h3 className="font-semibold text-lg">{plan.name}</h3>
                                                <p className="text-sm text-muted-foreground">
                                                    ${plan.price}/month
                                                </p>
                                            </div>
                                            {selectedPlan === plan.key && (
                                                <div className="h-6 w-6 rounded-full bg-primary flex items-center justify-center">
                                                    <Check className="h-4 w-4 text-primary-foreground" />
                                                </div>
                                            )}
                                        </div>

                                        <div className="space-y-1 mb-3">
                                            {plan.payAsYouGo ? (
                                                <p className="text-sm font-medium text-amber-600">
                                                    Pay As You Go - Purchase minutes separately
                                                </p>
                                            ) : plan.minutes !== undefined ? (
                                                <p className="text-sm font-medium text-green-600">
                                                    Includes {plan.minutes.toLocaleString()} minutes
                                                </p>
                                            ) : (
                                                <p className="text-sm font-medium text-blue-600">
                                                    Unlimited minutes
                                                </p>
                                            )}
                                        </div>

                                        <ul className="space-y-1">
                                            {plan.features.slice(0, 3).map((feature, idx) => (
                                                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                                                    <span className="text-primary">•</span> {feature}
                                                </li>
                                            ))}
                                        </ul>
                                    </button>
                                ))}
                            </div>
                        )}

                        <DialogFooter className="gap-2">
                            <Button variant="outline" onClick={() => setStep("warning")}>
                                Back
                            </Button>
                            <Button
                                onClick={handleChangePlan}
                                disabled={!selectedPlan || loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Changing Plan...
                                    </>
                                ) : (
                                    "Confirm Plan Change"
                                )}
                            </Button>
                        </DialogFooter>
                    </>
                )}
            </DialogContent>
        </Dialog>
    );
}
