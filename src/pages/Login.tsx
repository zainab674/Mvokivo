import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Eye, EyeOff, Mail, Lock, Building2, ArrowRight, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useWebsiteSettings } from "@/contexts/WebsiteSettingsContext";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional()
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signIn } = useAuth();
  const { websiteSettings } = useWebsiteSettings();
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  });

  const rememberMe = watch("rememberMe");

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    try {
      console.log('Starting sign in process...');
      const result = await signIn(data.email, data.password);
      console.log('Sign in result:', result);

      if (result.success) {
        console.log('Sign in successful, navigating...');

        // Clear any stale signup data (user is logging in, so they already have an account)
        localStorage.removeItem("signup-data");

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
        const onboardingCompleted = localStorage.getItem("onboarding-completed") === "true";
        navigate(onboardingCompleted ? "/dashboard" : "/onboarding");
      } else {
        console.log('Sign in failed:', result.message);
        toast({
          title: "Sign in failed",
          description: result.message || "Please check your credentials and try again.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      console.error('Sign in error:', error);
      toast({
        title: "Sign in failed",
        description: error?.message || "Please check your credentials and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: `${provider} Sign In`,
      description: "Social login not configured yet.",
    });
  };

  const handleForgotPassword = async () => {
    const email = watch("email");
    if (!email) {
      toast({ title: "Enter your email", description: "Please enter your email above to receive a reset link." });
      return;
    }
    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();

      if (data.success) {
        toast({ title: "Reset email sent", description: data.message });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Reset failed", description: error?.message || "Please try again.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950" />
      <div className="absolute inset-0 bg-[url('/src/assets/glass-bg.png')] bg-cover bg-center opacity-[0.03] pointer-events-none" />

      {/* Animated Gradient Orbs */}
      <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] animate-pulse" />
      <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Theme toggle in top right */}
      <div className="absolute top-6 right-6 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-6xl mx-auto relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 items-center">
          {/* Left Side - Branding & Features */}
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
                Welcome back to{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-500 to-primary">
                  {websiteSettings?.website_name || "Vokivo"}
                </span>
              </h1>
              <p className="text-xl text-muted-foreground leading-relaxed">
                Sign in to access your dashboard and continue managing your AI-powered call center.
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
                  <Lock className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Enterprise Security</h3>
                  <p className="text-sm text-muted-foreground">
                    Your data is protected with bank-level encryption
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Building2 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">Scalable Infrastructure</h3>
                  <p className="text-sm text-muted-foreground">
                    Built to scale with your business needs
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="w-full">
            <Card className="w-full max-w-md mx-auto backdrop-blur-xl bg-zinc-900/50 border border-zinc-800/50 rounded-2xl shadow-2xl">
              <CardHeader className="text-center space-y-3 pb-6">
                {websiteSettings?.logo && (
                  <div className="flex justify-center mb-2 lg:hidden">
                    <img
                      src={websiteSettings.logo}
                      alt={websiteSettings.website_name || "Logo"}
                      className="h-10 w-auto object-contain"
                    />
                  </div>
                )}
                <CardTitle className="text-3xl font-bold text-foreground">
                  Welcome back
                </CardTitle>
                <CardDescription className="text-base text-muted-foreground">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Social Login Options */}
                <div className="space-y-3">
                  <Button
                    variant="outline"
                    className="w-full h-11 bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                    onClick={() => handleSocialLogin("Google")}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Continue with Google
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full h-11 bg-zinc-800/50 border-zinc-700/50 hover:bg-zinc-800 hover:border-zinc-600 transition-colors"
                    onClick={() => handleSocialLogin("Microsoft")}
                  >
                    <Building2 className="w-4 h-4 mr-2" />
                    Continue with Microsoft
                  </Button>
                </div>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full border-zinc-700" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-zinc-900/50 px-3 text-muted-foreground font-medium">or continue with email</span>
                  </div>
                </div>

                {/* Login Form */}
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">Email address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...register("email")}
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        className="pl-10 h-11 bg-zinc-800/30 border-zinc-700/50 focus:border-primary/50"
                      />
                    </div>
                    {errors.email && (
                      <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                      <Input
                        {...register("password")}
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        className="pl-10 pr-10 h-11 bg-zinc-800/30 border-zinc-700/50 focus:border-primary/50"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="rememberMe"
                        checked={rememberMe || false}
                        onCheckedChange={(checked) => setValue("rememberMe", checked as boolean)}
                        className="border-zinc-700"
                      />
                      <Label
                        htmlFor="rememberMe"
                        className="text-sm text-muted-foreground leading-none cursor-pointer"
                      >
                        Remember me
                      </Label>
                    </div>
                    <button
                      type="button"
                      onClick={handleForgotPassword}
                      className="text-sm text-primary hover:underline font-medium"
                    >
                      Forgot password?
                    </button>
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-11 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-colors"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      "Signing in..."
                    ) : (
                      <>
                        Sign in
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>

                <div className="text-center text-sm pt-2">
                  <span className="text-muted-foreground">Don't have an account? </span>
                  <Link
                    to="/signup"
                    className="text-primary hover:underline font-medium transition-colors"
                  >
                    Sign up for free
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}