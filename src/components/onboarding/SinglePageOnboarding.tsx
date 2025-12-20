import React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useOnboarding } from "@/hooks/useOnboarding";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useBusinessUseCase } from "@/components/BusinessUseCaseProvider";
import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BUSINESS_USE_CASE_TEMPLATES, BusinessUseCase } from "@/types/businessUseCase";
import { getPlanConfigs, PLAN_CONFIGS } from "@/lib/plan-config";
import { extractTenantFromHostname } from "@/lib/tenant-utils";
import { useToast } from "@/hooks/use-toast";
import { Building2, Target, CreditCard, ArrowRight, Star, Check } from "lucide-react";

const schema = z.object({
    companyName: z.string().min(1, "Company name is required"),
    industry: z.string().min(1, "Please select an industry"),
    teamSize: z.string().min(1, "Please select team size"),
    role: z.string().min(1, "Please select your role"),
    useCase: z.string().min(1, "Please select a use case"),
    theme: z.string(),
    notifications: z.boolean(),
    goals: z.array(z.string()),
    plan: z.string().min(1, "Please select a plan"),
});

type FormData = z.infer<typeof schema>;

const industries = [
    "Technology", "Healthcare", "Finance", "Real Estate", "Education",
    "E-commerce", "Manufacturing", "Consulting", "Marketing", "Legal",
    "Non-profit", "Government", "Other"
];

const teamSizes = [
    "Just me", "2-10 people", "11-50 people", "51-200 people",
    "201-1000 people", "1000+ people"
];

const roles = [
    "CEO/Founder", "Sales Manager", "Marketing Manager", "Operations Manager",
    "Customer Success", "Business Development", "Account Manager", "Team Lead",
    "Individual Contributor", "Other"
];

const goalOptions = [
    { id: "improve_conversion", label: "Improve conversion rates" },
    { id: "track_performance", label: "Track team performance" },
    { id: "analyze_calls", label: "Analyze call quality" },
    { id: "automate_reporting", label: "Automate reporting" },
    { id: "train_team", label: "Train team members" },
    { id: "scale_operations", label: "Scale operations" }
];

export function SinglePageOnboarding() {
    const { data, updateData, complete } = useOnboarding();
    const { user, loading: isLoading } = useAuth();
    const { setUseCase } = useBusinessUseCase();
    const { setUIStyle } = useTheme();
    const navigate = useNavigate();
    const { toast } = useToast();

    const [plans, setPlans] = React.useState<Array<{
        key: string;
        name: string;
        price: string;
        features: string[];
    }>>([]);
    const [loadingPlans, setLoadingPlans] = React.useState(true);
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<FormData>({
        resolver: zodResolver(schema),
        defaultValues: {
            companyName: data.companyName || "",
            industry: data.industry || "",
            teamSize: data.teamSize || "",
            role: data.role || "",
            useCase: data.useCase || "appointment-setting",
            theme: data.theme || "glass",
            notifications: data.notifications ?? true,
            goals: data.goals || [],
            plan: data.plan || "starter",
        },
    });

    // Fetch plans
    React.useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoadingPlans(true);
                const tenant = extractTenantFromHostname();
                const tenantSlug = tenant === "main" ? null : tenant;
                const planConfigs = await getPlanConfigs(tenantSlug);

                const plansList = Object.values(planConfigs)
                    .filter(plan => plan.key !== "free")
                    .map(plan => ({
                        key: plan.key,
                        name: plan.name,
                        price: `$${plan.price}`,
                        features: plan.features
                    }));

                setPlans(plansList);
            } catch (error) {
                const fallback = Object.values(PLAN_CONFIGS)
                    .filter(plan => plan.key !== "free")
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

    // Check authentication
    React.useEffect(() => {
        if (isLoading) return;

        const signupData = localStorage.getItem("signup-data");
        if (!signupData && !user) {
            navigate("/signup");
            return;
        }

        if (user) {
            const dbCompleted = Boolean(user.onboarding_completed);
            if (dbCompleted) {
                navigate("/dashboard");
            }
        }
    }, [user, isLoading, navigate]);

    const onSubmit = async (values: FormData) => {
        try {
            setIsSubmitting(true);

            // Update all onboarding data
            updateData({
                companyName: values.companyName,
                industry: values.industry,
                teamSize: values.teamSize,
                role: values.role,
                useCase: values.useCase,
                theme: values.theme,
                notifications: values.notifications,
                goals: values.goals,
                plan: values.plan,
            });

            // Set use case and theme
            setUseCase(values.useCase as BusinessUseCase);
            setUIStyle(values.theme as "glass" | "minimal");

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
                const signupTenant = signupData.tenant || null;

                const response = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/v1/auth/signup`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: signupData.email,
                        password: signupData.password,
                        name: signupData.name,
                        tenant: signupTenant
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
            let finalTenant = currentUser?.tenant || 'main';

            // 3. ONBOARDING / PROFILE UPDATE
            const trialEndsAt = new Date();
            trialEndsAt.setDate(trialEndsAt.getDate() + 7);

            const onboardingPayload = {
                name: signupData?.name || currentUser?.fullName || "",
                company: values.companyName,
                industry: values.industry,
                team_size: values.teamSize,
                role: values.role || "user",
                use_case: values.useCase,
                theme: values.theme,
                notifications: values.notifications,
                goals: values.goals,
                plan: values.plan,
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
            console.error("Error submitting onboarding:", error);
            toast({
                title: "Could not complete setup",
                description: error?.message || "Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleGoalToggle = (goalId: string) => {
        const currentGoals = form.watch("goals") || [];
        const updatedGoals = currentGoals.includes(goalId)
            ? currentGoals.filter(id => id !== goalId)
            : [...currentGoals, goalId];
        form.setValue("goals", updatedGoals);
    };

    return (
        <div className="min-h-screen bg-[#5b21b6] relative overflow-hidden">
            {/* Background patterns - matching landing page */}
            <div className="absolute inset-0 z-0 opacity-20">
                <div className="absolute top-[10%] left-[5%] w-64 h-64 bg-white/20 rounded-full blur-3xl"></div>
                <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-400/30 rounded-full blur-3xl"></div>
                <div className="absolute top-0 right-0 w-full h-full bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white/10 via-transparent to-transparent"></div>

                {/* Dot pattern */}
                <div className="absolute top-20 left-10 grid grid-cols-6 gap-2">
                    {[...Array(36)].map((_, i) => (
                        <div key={i} className="w-1 h-1 bg-white/40 rounded-full"></div>
                    ))}
                </div>
            </div>

            {/* Content */}
            <div className="relative z-10 container mx-auto px-6 py-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-5xl mx-auto"
                >
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-1.5 mb-6">
                            <Star className="w-4 h-4 fill-white text-white" />
                            <span className="text-xs font-semibold uppercase tracking-wider text-white">Get Started with VOKIVO</span>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
                            Complete Your Profile
                        </h1>
                        <p className="text-lg text-white/80 max-w-2xl mx-auto">
                            Tell us about your business to customize your AI voice agent experience
                        </p>
                    </div>

                    {/* Form */}
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                            {/* Business Profile Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.1 }}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/20 rounded-full">
                                        <Building2 className="h-6 w-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Business Profile</h2>
                                </div>

                                <div className="grid gap-6">
                                    <FormField
                                        control={form.control}
                                        name="companyName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-white font-medium">Company Name</FormLabel>
                                                <FormControl>
                                                    <Input
                                                        {...field}
                                                        placeholder="Enter your company name"
                                                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-white/40 h-12"
                                                    />
                                                </FormControl>
                                                <FormMessage className="text-red-300" />
                                            </FormItem>
                                        )}
                                    />

                                    <div className="grid md:grid-cols-3 gap-6">
                                        <FormField
                                            control={form.control}
                                            name="industry"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white font-medium">Industry</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                                                                <SelectValue placeholder="Select industry" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-purple-900 border-white/20 text-white">
                                                            {industries.map((industry) => (
                                                                <SelectItem key={industry} value={industry} className="hover:bg-white/10">
                                                                    {industry}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-red-300" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="teamSize"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white font-medium">Team Size</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                                                                <SelectValue placeholder="Select team size" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-purple-900 border-white/20 text-white">
                                                            {teamSizes.map((size) => (
                                                                <SelectItem key={size} value={size} className="hover:bg-white/10">
                                                                    {size}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-red-300" />
                                                </FormItem>
                                            )}
                                        />

                                        <FormField
                                            control={form.control}
                                            name="role"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel className="text-white font-medium">Your Role</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="bg-white/10 border-white/20 text-white h-12">
                                                                <SelectValue placeholder="Select your role" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent className="bg-purple-900 border-white/20 text-white">
                                                            {roles.map((role) => (
                                                                <SelectItem key={role} value={role} className="hover:bg-white/10">
                                                                    {role}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage className="text-red-300" />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                </div>
                            </motion.div>

                            {/* Use Case Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/20 rounded-full">
                                        <Target className="h-6 w-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Primary Use Case</h2>
                                </div>

                                <FormField
                                    control={form.control}
                                    name="useCase"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <div className="grid gap-4">
                                                    {Object.entries(BUSINESS_USE_CASE_TEMPLATES).map(([key, config]) => (
                                                        <div
                                                            key={key}
                                                            onClick={() => field.onChange(key)}
                                                            className={`p-6 rounded-2xl border cursor-pointer transition-all duration-300 ${field.value === key
                                                                ? 'bg-white/20 border-white/40 shadow-lg'
                                                                : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
                                                                }`}
                                                        >
                                                            <div className="flex items-start justify-between">
                                                                <div className="flex-1">
                                                                    <div className="flex items-center gap-3 mb-2">
                                                                        <h3 className="text-lg font-semibold text-white">{config.name}</h3>
                                                                        {field.value === key && (
                                                                            <div className="p-1 bg-white/30 rounded-full">
                                                                                <Check className="h-4 w-4 text-white" />
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    <p className="text-sm text-white/70 mb-3">{config.description}</p>
                                                                    <div className="flex flex-wrap gap-2">
                                                                        {config.metrics.slice(0, 3).map((metric) => (
                                                                            <span key={metric.key} className="text-xs px-3 py-1 bg-white/10 border border-white/20 rounded-full text-white">
                                                                                {metric.label}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </FormControl>
                                            <FormMessage className="text-red-300" />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>

                            {/* Preferences Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.3 }}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/20 rounded-full">
                                        <Target className="h-6 w-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Your Goals</h2>
                                </div>

                                <div className="space-y-6">


                                    {/* Goals */}
                                    <div className="p-4 bg-white/5 rounded-xl">
                                        <h3 className="text-lg font-semibold text-white mb-3">What do you want to achieve?</h3>
                                        <p className="text-sm text-white/60 mb-4">Select all that apply</p>
                                        <div className="grid md:grid-cols-2 gap-3">
                                            {goalOptions.map((goal) => (
                                                <div key={goal.id} className="flex items-center space-x-3">
                                                    <Checkbox
                                                        id={goal.id}
                                                        checked={(form.watch("goals") || []).includes(goal.id)}
                                                        onCheckedChange={() => handleGoalToggle(goal.id)}
                                                        className="border-white/40 data-[state=checked]:bg-white data-[state=checked]:text-purple-700"
                                                    />
                                                    <Label
                                                        htmlFor={goal.id}
                                                        className="text-sm text-white cursor-pointer"
                                                    >
                                                        {goal.label}
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Pricing Plan Section */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.4 }}
                                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8"
                            >
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="p-3 bg-white/20 rounded-full">
                                        <CreditCard className="h-6 w-6 text-white" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-white">Choose Your Plan</h2>
                                </div>

                                <p className="text-white/70 mb-6">Start with a 7-day free trial. Pick a plan now; you can change it anytime.</p>

                                <FormField
                                    control={form.control}
                                    name="plan"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                {loadingPlans ? (
                                                    <div className="text-center text-white py-8">Loading plans...</div>
                                                ) : (
                                                    <div className="grid md:grid-cols-3 gap-6">
                                                        {plans.map((plan) => (
                                                            <button
                                                                key={plan.key}
                                                                type="button"
                                                                onClick={() => field.onChange(plan.key)}
                                                                className={`p-6 text-left rounded-2xl border transition-all duration-300 ${field.value === plan.key
                                                                    ? "bg-white/20 border-white/40 shadow-lg scale-105"
                                                                    : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
                                                                    }`}
                                                            >
                                                                <div className="flex justify-between items-start mb-4">
                                                                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                                                                    {field.value === plan.key && (
                                                                        <div className="p-1 bg-white/30 rounded-full">
                                                                            <Check className="h-4 w-4 text-white" />
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                <div className="text-3xl font-bold text-white mb-4">
                                                                    {plan.price}<span className="text-lg text-white/60">/mo</span>
                                                                </div>
                                                                <ul className="space-y-2 text-sm text-white/80">
                                                                    {plan.features.map((feature, idx) => (
                                                                        <li key={idx} className="flex items-start gap-2">
                                                                            <span className="text-white/60">•</span>
                                                                            <span>{feature}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                                <div className="mt-4 pt-4 border-t border-white/10">
                                                                    <p className="text-xs text-white/60">Includes 7-day free trial</p>
                                                                </div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </FormControl>
                                            <FormMessage className="text-red-300" />
                                        </FormItem>
                                    )}
                                />
                            </motion.div>

                            {/* Submit Button */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.6, delay: 0.5 }}
                                className="flex justify-center"
                            >
                                <Button
                                    type="submit"
                                    disabled={isSubmitting || loadingPlans}
                                    className="bg-white text-purple-700 hover:bg-white/90 rounded-full h-14 px-12 text-lg font-bold flex items-center gap-2 group transition-all shadow-xl"
                                >
                                    {isSubmitting ? "Setting up..." : "Complete Setup"}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Button>
                            </motion.div>
                        </form>
                    </Form>
                </motion.div>
            </div>
        </div>
    );
}
