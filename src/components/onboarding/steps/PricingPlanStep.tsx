import React from "react";
import { motion } from "framer-motion";
import { useOnboarding } from "@/hooks/useOnboarding";
import { Button } from "@/components/ui/button";
import { getPlanConfigs, PLAN_CONFIGS } from "@/lib/plan-config";
import { extractTenantFromHostname } from "@/lib/tenant-utils";
import { useToast } from "@/hooks/use-toast";

export function PricingPlanStep() {
  const { data, updateData, nextStep, prevStep } = useOnboarding();
  const { toast } = useToast();

  const [selected, setSelected] = React.useState<string>(data.plan || "starter");
  const [plans, setPlans] = React.useState<Array<{
    key: string;
    name: string;
    price: string;
    features: string[];
  }>>([]);
  const [loadingPlans, setLoadingPlans] = React.useState(true);

  // Fetch plans normally (NO MINUTES LOGIC)
  React.useEffect(() => {
    const fetchPlans = async () => {
      try {
        setLoadingPlans(true);

        const tenant = extractTenantFromHostname();
        const tenantSlug = tenant === "main" ? null : tenant;

        const planConfigs = await getPlanConfigs(tenantSlug);

        const plansList = Object.values(planConfigs)

          .map(plan => ({
            key: plan.key,
            name: plan.name,
            price: `$${plan.price}`,
            features: plan.features
          }));

        setPlans(plansList);
      } catch (error) {
        // fallback to static
        const fallback = Object.values(PLAN_CONFIGS)

          .map(plan => ({
            key: plan.key,
            name: plan.name,
            price: `$${plan.price}`,
            features: plan.features
          }));

        setPlans(fallback);
      } finally {
        setLoadingPlans(false);
      }
    };

    fetchPlans();
  }, []);

  const handleContinue = () => {
    updateData({ plan: selected });
    nextStep();
  };

  if (loadingPlans) {
    return (
      <div className="space-y-[var(--space-2xl)]">
        <div className="text-center">
          <h2 className="text-[var(--text-2xl)] font-[var(--font-bold)] text-theme-primary">
            Choose your plan
          </h2>
          <p className="text-[var(--text-base)] text-theme-secondary max-w-xl mx-auto mt-4">
            Loading plans...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-2xl)]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center space-y-[var(--space-md)]"
      >
        <h2 className="text-[var(--text-2xl)] font-[var(--font-bold)] text-theme-primary">
          Choose your plan
        </h2>
        <p className="text-[var(--text-base)] text-theme-secondary max-w-xl mx-auto">
          Start with a 7-day free trial. Pick a plan now; you can change it anytime.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid md:grid-cols-3 gap-[var(--space-xl)]"
      >
        {plans.map((plan) => (
          <button
            key={plan.key}
            type="button"
            onClick={() => setSelected(plan.key)}
            className={`p-[var(--space-xl)] text-left liquid-rounded-xl border transition-all duration-200 ${selected === plan.key
              ? "liquid-glass-premium border-white/20"
              : "liquid-glass-light border-white/10 hover:liquid-glass-medium"
              }`}
          >
            <div className="flex justify-between items-center mb-[var(--space-md)]">
              <h3 className="text-[var(--text-lg)] font-[var(--font-semibold)] text-theme-primary">
                {plan.name}
              </h3>
              <span className="text-[var(--text-base)] text-theme-primary/90">
                {plan.price}/mo
              </span>
            </div>

            <ul className="space-y-2 text-[var(--text-sm)] text-theme-secondary">
              {plan.features.map((f) => (
                <li key={f}>• {f}</li>
              ))}
            </ul>

            <div className="mt-[var(--space-md)] space-y-1">
              <div className="text-[var(--text-xs)] text-theme-secondary">
                Includes 7-day free trial
              </div>
            </div>
          </button>
        ))}
      </motion.div>

      <div className="flex gap-[var(--space-md)] pt-[var(--space-lg)]">
        <Button
          type="button"
          variant="ghost"
          onClick={prevStep}
          className="liquid-glass-light hover:liquid-glass-medium"
        >
          Back
        </Button>
        <Button type="button" onClick={handleContinue} className="liquid-button flex-1">
          Continue
        </Button>
      </div>
    </div>
  );
}
