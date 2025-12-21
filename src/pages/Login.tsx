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

import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { useWebsiteSettings } from "@/contexts/WebsiteSettingsContext";
import { BACKEND_URL } from "@/lib/api-config";

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
      const response = await fetch(`${BACKEND_URL}/api/v1/auth/forgot-password`, {
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
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-[#7c3aed] opacity-90 z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)] z-0" />

      <div className="w-full max-w-5xl bg-white rounded-[30px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[600px] relative z-10 transition-all duration-500 ease-in-out">

        {/* Left Side - Welcome Info (Purple) */}
        <div className="w-full md:w-[40%] bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] p-12 text-white flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden">
          {/* Animated Background Waves */}
          <div className="absolute inset-0 opacity-20">
            <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M0,1000 C300,800 400,950 700,700 C900,500 1000,600 1000,0 L0,0 Z" fill="white" opacity="0.1" />
              <path d="M1000,1000 C700,800 600,950 300,700 C100,500 0,600 0,0 L1000,0 Z" fill="white" opacity="0.05" />
            </svg>
          </div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-4xl font-bold">Hello user</h2>
            <p className="text-sm opacity-90 leading-relaxed max-w-[250px] mx-auto">
              For make an account and stay connect in sign up with your gmail or facebook or email address
            </p>
            <Link to="/signup">
              <Button
                variant="outline"
                className="mt-8 rounded-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#7c3aed] px-10 h-12 uppercase font-bold transition-all"
              >
                Sign Up
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side - Login Form (White) */}
        <div className="w-full md:w-[60%] bg-white p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-10">
            <div className="text-center">
              <h1 className="text-3xl font-bold text-[#333]">Log in to your account</h1>
            </div>

            {/* Social Logins */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => handleSocialLogin("Google")}
                className="flex items-center gap-3 px-6 py-2 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span className="text-sm font-medium text-gray-500">Sign in with google</span>
              </button>
              <button
                onClick={() => handleSocialLogin("Facebook")}
                className="flex items-center gap-3 px-6 py-2 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-5 h-5 bg-[#1877f2] rounded flex items-center justify-center">
                  <span className="text-white text-xs font-bold">f</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Sign in with facebook</span>
              </button>
            </div>

            <div className="relative flex items-center py-4">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">or use your email address for Login</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7c3aed] transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="Email address"
                    className="w-full pl-12 pr-4 py-3 bg-[#f0f2f5] border-none rounded-xl focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all placeholder:text-gray-400 text-gray-700"
                  />
                  {errors.email && (
                    <p className="text-xs text-red-500 mt-1 pl-2">{errors.email.message}</p>
                  )}
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7c3aed] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    {...register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full pl-12 pr-12 py-3 bg-[#f0f2f5] border-none rounded-xl focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all placeholder:text-gray-400 text-gray-700"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {errors.password && (
                    <p className="text-xs text-red-500 mt-1 pl-2">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe || false}
                    onCheckedChange={(checked) => setValue("rememberMe", checked as boolean)}
                    className="border-gray-300 data-[state=checked]:bg-[#7c3aed] data-[state=checked]:border-[#7c3aed]"
                  />
                  <Label htmlFor="rememberMe" className="text-sm text-gray-500 cursor-pointer">
                    Remember me
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-[#7c3aed] font-semibold hover:underline"
                >
                  Forgot password?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-14 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full text-lg font-bold shadow-lg shadow-[#7c3aed]/20 transition-all active:scale-[0.98] uppercase tracking-wider"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <span>Don't have an account? </span>
              <Link to="/signup" className="text-[#7c3aed] font-bold hover:underline">
                Sign Up
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}