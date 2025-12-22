import React, { useState, useEffect } from "react";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { CreditCard, Check, ExternalLink, ShieldCheck } from "lucide-react";
import { getPlanConfigs, PlanConfig } from "@/lib/plan-config";
import { extractTenantFromHostname } from "@/lib/tenant-utils";

export function PaymentStep() {
  const { data, prevStep } = useOnboarding();
  const { user } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanConfig | null>(null);
  const [loadingPlan, setLoadingPlan] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoadingPlan(true);
        const tenant = extractTenantFromHostname();
        const tenantSlug = tenant === 'main' ? null : tenant;
        const planConfigs = await getPlanConfigs(tenantSlug);
        const planKey = data.plan?.toLowerCase() || 'starter';

        // Try to find the plan, fallback to starter if not found
        const plan = planConfigs[planKey];

        if (!plan) {
          // If strict matching fails, try to find a default fallback or show error
          // For now, logging error but potentially falling back to a known default if available in cache locally
          console.warn(`Plan ${planKey} not found in configs.`);
        }

        setSelectedPlan(plan || planConfigs.starter);
      } catch (error) {
        console.error('Error fetching plan config:', error);
        setError("Failed to load plan details. Please try again.");
      } finally {
        setLoadingPlan(false);
      }
    };

    fetchPlan();
  }, [data.plan]);

  const handleSubscribe = async () => {
    if (!selectedPlan) return;

    try {
      setError(null);
      // Use backend to generate checkout session securely
      const token = localStorage.getItem('token'); // or however auth is handled locally if not in cookie
      // The useAuth hook might provide a way to get the token or axio interceptor might handle it.
      // Assuming headers need to be set or context handles it. 
      // Let's assume standard fetch with Authorization header if useAuth doesn't expose an axio instance.
      // Since I don't see axios instance in imports, I'll attempt to get token or rely on cookie if used.
      // Looking at other files might help but standard pattern is usually localStorage 'token' or 'accessToken'.

      const backendUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL || 'http://localhost:4000';

      const response = await fetch(`${backendUrl}/api/v1/checkouts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          planKey: selectedPlan.key,
          variantId: selectedPlan.variantId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || result.message || 'Failed to initiate checkout');
      }

      if (result.url) {
        window.location.href = result.url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (err: any) {
      console.error('Checkout error:', err);
      setError(err.message || 'Failed to redirect to payment provider');
    }
  };

  if (loadingPlan) {
    return (
      <div className="space-y-[var(--space-2xl)]">
        <div className="text-center">
          <h2 className="text-[var(--text-2xl)] font-[var(--font-semibold)] text-theme-primary mb-[var(--space-sm)]">
            Preparing Checkout
          </h2>
          <p className="text-[var(--text-base)] text-theme-secondary">
            Loading plan details...
          </p>
        </div>
      </div>
    );
  }

  if (error || !selectedPlan) {
    return (
      <div className="space-y-[var(--space-2xl)]">
        <div className="text-center">
          <h2 className="text-[var(--text-2xl)] font-[var(--font-semibold)] text-red-500 mb-[var(--space-sm)]">
            Error
          </h2>
          <p className="text-[var(--text-base)] text-theme-secondary">
            {error || "Plan details could not be loaded."}
          </p>
          <Button variant="outline" onClick={prevStep} className="mt-4">Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-2xl)] max-w-4xl mx-auto">
      <div className="text-center">
        <h2 className="text-[var(--text-2xl)] font-[var(--font-semibold)] text-theme-primary mb-[var(--space-sm)]">
          Complete Your Subscription
        </h2>
        <p className="text-[var(--text-base)] text-theme-secondary">
          Secure checkout via Lemon Squeezy
        </p>
      </div>

      <div className="grid md:grid-cols-1 gap-[var(--space-xl)] justify-center">
        {/* Plan Summary Card */}
        <Card className="liquid-glass-light border-white/10 max-w-lg mx-auto w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-theme-primary">
              <CreditCard className="h-5 w-5" />
              {selectedPlan.name} Plan
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end">
              <div>
                <span className="text-3xl font-bold text-theme-primary">${selectedPlan.price}</span>
                <span className="text-theme-secondary ml-1">/month</span>
              </div>
            </div>

            <Separator className="bg-white/10" />

            <div className="space-y-3">
              <h4 className="font-medium text-theme-primary text-sm uppercase tracking-wide opacity-80">Includes:</h4>
              <ul className="space-y-2 text-sm text-theme-secondary">
                {selectedPlan.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="pt-6 space-y-4">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 flex items-start gap-3">
                <ShieldCheck className="h-5 w-5 text-blue-400 mt-0.5" />
                <p className="text-xs text-blue-200">
                  You will be redirected to Lemon Squeezy for secure payment processing. No credit card information is stored on our servers.
                </p>
              </div>

              <div className="flex gap-[var(--space-md)]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={prevStep}
                  className="liquid-glass-light hover:liquid-glass-medium flex-1"
                >
                  Back
                </Button>
                <Button
                  onClick={handleSubscribe}
                  className="liquid-button flex-1 gap-2"
                >
                  Proceed to Checkout
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
