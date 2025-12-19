import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle, Sparkles } from "lucide-react";
import { extractTenantFromHostname } from "@/lib/tenant-utils";

export function OnboardingComplete() {
  const { data, complete } = useOnboarding();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleComplete = async () => {
    try {
      // Get signup data from localStorage
      const signupDataStr = localStorage.getItem("signup-data");

      let currentToken = localStorage.getItem("token");
      let currentUser = user;

      if (!signupDataStr && !currentUser?.id) {
        toast({
          title: "Missing signup information",
          description: "Please start from the signup page.",
          variant: "destructive",
        });
        navigate("/signup");
        return;
      }

      let userId = currentUser?.id;
      let isNewUser = false;
      let signupData = null;

      if (signupDataStr) {
        signupData = JSON.parse(signupDataStr);
      }

      // 1. SIGNUP (if needed)
      if (signupData) {
        // Extract tenant from signup data (already determined during signup)
        const signupTenant = signupData.tenant || null;

        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/v1/auth/signup`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: signupData.email,
            password: signupData.password,
            name: signupData.name,
            tenant: signupTenant // Pass tenant from signup data
          })
        });

        const authResult = await response.json();

        if (!response.ok) {
          throw new Error(authResult.message || "Failed to create user account");
        }

        // Save token and user
        localStorage.setItem('token', authResult.token);
        currentToken = authResult.token;
        userId = authResult.user.id;
        currentUser = authResult.user;
        isNewUser = true;

        // Clear signup data
        localStorage.removeItem("signup-data");
      }

      if (!userId || !currentToken) {
        throw new Error("User ID or Token is missing");
      }

      // 2. TENANT DETERMINATION
      // Use the tenant from the authenticated user (already set during signup)
      let finalTenant = currentUser?.tenant || 'main';

      // 3. ONBOARDING / PROFILE UPDATE
      // Calculate trial end
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      // Prepare payload - backend will assign minutes based on plan
      const onboardingPayload = {
        name: signupData?.name || currentUser?.fullName || "",
        company: data.companyName,
        industry: data.industry,
        team_size: data.teamSize,
        role: data.role || "user",
        use_case: data.useCase,
        theme: data.theme,
        notifications: data.notifications,
        goals: data.goals,
        plan: data.plan, // Backend will use this to assign minutes
        contact: {
          email: signupData?.email || currentUser?.email || "",
          phone: signupData?.phone || null,
          countryCode: signupData?.countryCode || null,
        },
        trial_ends_at: trialEndsAt.toISOString(),
        tenant: finalTenant
      };

      const profileResponse = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/v1/user/onboarding`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentToken}`
        },
        body: JSON.stringify(onboardingPayload)
      });

      const profileResult = await profileResponse.json();
      if (!profileResponse.ok) {
        throw new Error(profileResult.message || "Failed to complete onboarding");
      }

      // Mark local complete
      complete();
      localStorage.removeItem("onboarding-state");

      toast({
        title: "Welcome aboard! 🎉",
        description: isNewUser
          ? "Your account has been created successfully! Redirecting to login..."
          : "Your account has been set up successfully. Let's get started!",
      });

      if (isNewUser) {
        setTimeout(() => navigate("/login"), 1000);
      } else {
        navigate("/dashboard");
      }

    } catch (error: any) {
      console.error("Error completing onboarding:", error);
      toast({
        title: "Could not complete setup",
        description: error?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };


  const completedSteps = [
    { title: "Business Profile", description: `${data.companyName} in ${data.industry}` },
    { title: "Use Case", description: "Customized dashboard and terminology" },
    { title: "Preferences", description: `${data.theme} UI with notifications ${data.notifications ? 'enabled' : 'disabled'}` },
  ];

  return (
    <div className="text-center space-y-[var(--space-2xl)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
        className="space-y-[var(--space-lg)]"
      >
        <div className="flex justify-center mb-[var(--space-lg)]">
          <div className="relative">
            <div className="p-[var(--space-lg)] liquid-glass-premium liquid-rounded-full">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, duration: 0.4 }}
              className="absolute -top-2 -right-2 p-2 liquid-glass-medium liquid-rounded-full"
            >
              <Sparkles className="h-4 w-4 text-primary" />
            </motion.div>
          </div>
        </div>

        <h1 className="text-[var(--text-3xl)] font-[var(--font-bold)] text-theme-primary">
          You're all set!
        </h1>

        <p className="text-[var(--text-lg)] text-theme-secondary max-w-2xl mx-auto leading-relaxed">
          Welcome to your personalized dashboard{(() => {
            const signupDataStr = localStorage.getItem("signup-data");
            if (signupDataStr) {
              const signupData = JSON.parse(signupDataStr);
              return `, ${signupData.name?.split(' ')[0] || 'there'}`;
            }
            return user?.fullName ? `, ${user.fullName.split(' ')[0]}` : '';
          })()}.
          We've customized everything based on your preferences and business needs.
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="max-w-md mx-auto space-y-[var(--space-md)]"
      >
        <h3 className="text-[var(--text-base)] font-[var(--font-semibold)] text-theme-primary mb-[var(--space-lg)]">
          Setup Complete
        </h3>

        {completedSteps.map((step, index) => (
          <motion.div
            key={step.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
            className="flex items-center gap-[var(--space-md)] p-[var(--space-md)] liquid-glass-light liquid-rounded-lg"
          >
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="text-left">
              <p className="text-[var(--text-sm)] font-[var(--font-medium)] text-theme-primary">
                {step.title}
              </p>
              <p className="text-[var(--text-xs)] text-theme-secondary">
                {step.description}
              </p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.6 }}
        className="pt-[var(--space-lg)]"
      >
        <Button
          onClick={handleComplete}
          size="lg"
          className="liquid-button px-[var(--space-3xl)] py-[var(--space-lg)] text-[var(--text-base)] font-[var(--font-medium)]"
        >
          Enter Dashboard
        </Button>
      </motion.div>
    </div>
  );
}