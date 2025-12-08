import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, Shield, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebsiteSettings } from "@/contexts/WebsiteSettingsContext";

const signUpSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  countryCode: z.string().min(1, "Please select a country code"),
  phone: z.string().min(6, "Please enter a valid phone number"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  acceptTerms: z.boolean().refine((val) => val === true, {
    message: "You must accept the Terms of Service & Privacy Policy"
  })
});

type SignUpFormData = z.infer<typeof signUpSchema>;

const countryCodes = [
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+1", country: "Canada", flag: "🇨🇦" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+33", country: "France", flag: "🇫🇷" },
  { code: "+49", country: "Germany", flag: "🇩🇪" },
  { code: "+39", country: "Italy", flag: "🇮🇹" },
  { code: "+34", country: "Spain", flag: "🇪🇸" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "Korea", flag: "🇰🇷" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+91", country: "India", flag: "🇮🇳" },
  { code: "+55", country: "Brazil", flag: "🇧🇷" },
  { code: "+52", country: "Mexico", flag: "🇲🇽" },
  { code: "+61", country: "Australia", flag: "🇦🇺" },
  { code: "+64", country: "New Zealand", flag: "🇳🇿" },
  { code: "+27", country: "South Africa", flag: "🇿🇦" },
  { code: "+47", country: "Norway", flag: "🇳🇴" },
  { code: "+46", country: "Sweden", flag: "🇸🇪" },
  { code: "+45", country: "Denmark", flag: "🇩🇰" },
  { code: "+41", country: "Switzerland", flag: "🇨🇭" },
];

export const FullScreenSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { websiteSettings } = useWebsiteSettings();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedCountry, setSelectedCountry] = React.useState<{ code: string; country: string; flag: string } | null>(countryCodes[0]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      countryCode: countryCodes[0].code
    }
  });

  const acceptTerms = watch("acceptTerms");

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true);
    try {
      // Clear any existing onboarding state when starting fresh signup
      localStorage.removeItem("onboarding-state");
      localStorage.removeItem("onboarding-completed");

      // Store signup data in localStorage instead of creating auth user
      // User will be created after onboarding is complete
      const signupData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        countryCode: data.countryCode
      };

      localStorage.setItem("signup-data", JSON.stringify(signupData));

      // Redirect to onboarding
      toast({
        title: "Great! Let's set up your profile",
        description: "We'll create your account after you complete onboarding.",
      });
      navigate("/onboarding");
    } catch (error: any) {
      toast({
        title: "Sign up failed",
        description: error?.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center overflow-hidden p-4 relative">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[url('/src/assets/glass-bg.png')] bg-cover bg-center opacity-[0.03] pointer-events-none" />
      
      {/* Animated Gradient Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Section - Brand/Features */}
          <div className="hidden lg:flex flex-col space-y-8 text-left">
            <div className="space-y-4">
              {websiteSettings?.logo && (
                <div className="mb-6">
                  <img
                    src={websiteSettings.logo}
                    alt={websiteSettings.website_name || "Logo"}
                    className="h-12 w-auto object-contain"
                  />
                </div>
              )}
              <h1 className="text-5xl font-bold tracking-tight text-foreground leading-tight">
                Start your journey with{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary">
                  {websiteSettings?.website_name || "AI Call Center"}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Join thousands of businesses using AI to transform their customer communication.
              </p>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">AI-Powered Analytics</h3>
                  <p className="text-sm text-muted-foreground">
                    Get real-time insights and analytics for all your calls
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Real-Time Monitoring</h3>
                  <p className="text-sm text-muted-foreground">
                    Track performance and optimize your call center operations
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Enterprise Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Bank-level encryption and compliance standards
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Section - Sign Up Form */}
          <div className="w-full">
            <div className="w-full max-w-md mx-auto backdrop-blur-xl bg-zinc-900/50 border border-zinc-800/50 rounded-2xl shadow-2xl p-8">
              {/* Header */}
              <div className="flex flex-col items-start mb-8">
                {websiteSettings?.logo && (
                  <div className="mb-4 lg:hidden">
                    <img
                      src={websiteSettings.logo}
                      alt={websiteSettings.website_name || "Logo"}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                )}
                <h2 className="text-3xl font-bold mb-2 tracking-tight text-foreground">
                  Create your account
                </h2>
                <p className="text-muted-foreground text-base">
                  Get started with {websiteSettings?.website_name || "AI Call Center"} today
                </p>
              </div>

              {/* Form */}
              <form className="flex flex-col gap-5" onSubmit={handleSubmit(onSubmit)} noValidate>
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Full Name
                  </Label>
                  <Input
                    type="text"
                    id="name"
                    placeholder="John Doe"
                    className="w-full h-11 bg-zinc-800/30 border-zinc-700/50 focus:border-primary/50"
                    {...register("name")}
                  />
                  {errors.name && (
                    <p className="text-destructive text-xs mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Email address
                  </Label>
                  <Input
                    type="email"
                    id="email"
                    placeholder="name@company.com"
                    className="w-full h-11 bg-zinc-800/30 border-zinc-700/50 focus:border-primary/50"
                    {...register("email")}
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number
                  </Label>
                  <div className="flex gap-3">
                    <Select
                      value={selectedCountry?.code}
                      onValueChange={(value) => {
                        const country = countryCodes.find(c => c.code === value);
                        setSelectedCountry(country || countryCodes[0]);
                        setValue("countryCode", value);
                      }}
                    >
                      <SelectTrigger className="w-28 h-11 bg-zinc-800/30 border-zinc-700/50 focus:border-primary/50">
                        <SelectValue>
                          <span className="text-sm">{selectedCountry?.flag}</span>
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="backdrop-blur-xl border-zinc-700 bg-zinc-900 z-50">
                        {countryCodes.map((country, index) => (
                          <SelectItem
                            key={`${country.code}-${country.country}-${index}`}
                            value={country.code}
                            className="hover:bg-zinc-800 focus:bg-zinc-800"
                          >
                            <span className="flex items-center gap-2 text-sm">
                              <span>{country.flag}</span>
                              <span>{country.code}</span>
                              <span className="text-muted-foreground">{country.country}</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Phone number"
                      className="flex-1 h-11 bg-zinc-800/30 border-zinc-700/50 focus:border-primary/50"
                      {...register("phone")}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-destructive text-xs mt-1">{errors.phone.message}</p>
                  )}
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      placeholder="Create a strong password"
                      className="w-full pr-12 h-11 bg-zinc-800/30 border-zinc-700/50 focus:border-primary/50"
                      {...register("password")}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-3 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-zinc-800 text-muted-foreground hover:text-foreground"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs mt-1">{errors.password.message}</p>
                  )}
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start space-x-3 pt-1">
                  <Checkbox
                    id="acceptTerms"
                    checked={acceptTerms || false}
                    onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
                    className="mt-1 border-zinc-700"
                  />
                  <Label
                    htmlFor="acceptTerms"
                    className="text-xs text-muted-foreground leading-relaxed cursor-pointer"
                  >
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary underline hover:no-underline font-medium">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary underline hover:no-underline font-medium">
                      Privacy Policy
                    </Link>
                  </Label>
                </div>
                {errors.acceptTerms && (
                  <p className="text-destructive text-xs -mt-2">{errors.acceptTerms.message}</p>
                )}

                {/* Submit Button */}
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors mt-2"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>

                {/* Alternative Method */}
                <div className="relative my-2">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-zinc-900/50 px-3 text-muted-foreground font-medium">or</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-11 bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600"
                >
                  Continue with email code
                </Button>

                {/* Sign In Link */}
                <div className="text-center text-muted-foreground text-sm pt-2">
                  Already have an account?{" "}
                  <Link to="/login" className="text-primary hover:underline font-medium transition-colors">
                    Sign in
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};