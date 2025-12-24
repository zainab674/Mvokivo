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
import { Eye, EyeOff, Mail, Lock, Building2, ArrowRight, Sparkles, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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
      const result = await signIn(data.email, data.password);
      if (result.success) {
        localStorage.removeItem("signup-data");
        toast({
          title: "Welcome back!",
          description: "Neural synchronization complete.",
        });
        const onboardingCompleted = localStorage.getItem("onboarding-completed") === "true";
        navigate(onboardingCompleted ? "/dashboard" : "/onboarding");
      } else {
        toast({
          title: "Access Denied",
          description: result.message || "Invalid credentials.",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "System Error",
        description: error?.message || "Connection failed.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = (provider: string) => {
    toast({
      title: `${provider} Integration`,
      description: "Social bridge not established.",
    });
  };

  const handleForgotPassword = async () => {
    const email = watch("email");
    if (!email) {
      toast({ title: "Email Required", description: "Identity check failed. Please enter your email." });
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
        toast({ title: "Signal Sent", description: data.message });
      } else {
        throw new Error(data.message);
      }
    } catch (error: any) {
      toast({ title: "Reset Failed", description: error?.message, variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-5xl bg-[#0a0b12]/80 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[640px] relative z-10">

        {/* Left Side - Welcome Info */}
        <div className="w-full md:w-[40%] bg-gradient-to-br from-pink-600/20 to-purple-900/20 p-12 text-white flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden border-r border-white/5 order-last md:order-first">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent opacity-50" />

          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-4 group hover:border-pink-500 transition-all">
              <LogIn className="w-8 h-8 text-pink-500" />
            </div>
            <h2 className="text-4xl font-bold tracking-tighter">NEW HERE?</h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-[280px] mx-auto font-light font-mono uppercase tracking-widest leading-loose">
              Initialize your neural node to stay connected with the system architecture.
            </p>
            <Link to="/signup">
              <Button
                variant="outline"
                className="mt-8 rounded-full border border-white/10 bg-white/5 text-white hover:bg-pink-500 hover:text-white hover:border-pink-500 px-12 h-14 uppercase font-bold tracking-widest font-mono text-xs transition-all"
              >
                INITIALIZE NODE
              </Button>
            </Link>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="w-full md:w-[60%] p-8 md:p-16 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-12">
            <div className="text-center">
              <div className="inline-block px-4 py-1.5 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-6 border border-pink-500/20">
                Identity Authentication
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tighter">SYSTEM LOGIN</h1>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => handleSocialLogin("Google")}
                className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] font-mono font-bold text-white/40 group-hover:text-white tracking-widest uppercase">Google Sync</span>
              </button>
              <button
                onClick={() => handleSocialLogin("Facebook")}
                className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="w-5 h-5 bg-[#1877f2]/20 rounded-lg flex items-center justify-center border border-[#1877f2]/40">
                  <span className="text-white text-[10px] font-bold">f</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-white/40 group-hover:text-white tracking-widest uppercase">Meta Bridge</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-white/20 text-[10px] uppercase font-mono tracking-widest">Neural Override</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-pink-500 transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="ACCESS KEY (EMAIL)"
                    className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-pink-500/50 outline-none transition-all placeholder:text-white/10 text-white font-mono text-xs tracking-widest"
                  />
                  {errors.email && (
                    <p className="text-[10px] font-mono text-pink-500/80 mt-2 pl-2 tracking-widest uppercase">{errors.email.message}</p>
                  )}
                </div>

                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-pink-500 transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    {...register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="PASSWORD"
                    className="w-full pl-12 pr-12 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-pink-500/50 outline-none transition-all placeholder:text-white/10 text-white font-mono text-xs tracking-widest"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {errors.password && (
                    <p className="text-[10px] font-mono text-pink-500/80 mt-2 pl-2 tracking-widest uppercase">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between px-2">
                <div className="flex items-center space-x-3">
                  <Checkbox
                    id="rememberMe"
                    checked={rememberMe || false}
                    onCheckedChange={(checked) => setValue("rememberMe", checked as boolean)}
                    className="border-white/20 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 rounded-md h-5 w-5"
                  />
                  <Label htmlFor="rememberMe" className="text-[10px] font-mono text-white/40 tracking-widest uppercase cursor-pointer">
                    Persistent Auth
                  </Label>
                </div>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-mono text-pink-500 font-bold hover:text-pink-400 tracking-widest uppercase"
                >
                  Forgot Key?
                </button>
              </div>

              <Button
                type="submit"
                className="w-full h-16 bg-white text-black hover:bg-pink-500 hover:text-white rounded-2xl text-sm font-mono font-bold tracking-[0.3em] uppercase transition-all shadow-2xl active:scale-[0.98]"
                disabled={isLoading}
              >
                {isLoading ? "SYNCHRONIZING..." : "INITIALIZE LOGIN"}
              </Button>
            </form>

            <div className="text-center text-[10px] font-mono tracking-widest text-white/20 uppercase">
              <span>UNREGISTERED NODE? </span>
              <Link to="/signup" className="text-pink-500 font-bold hover:text-pink-400 transition-colors">
                INITIALIZE SIGNUP
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}