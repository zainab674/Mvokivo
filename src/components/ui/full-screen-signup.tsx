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
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, Shield, Zap, User, Mail, Lock, LogIn, Globe } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebsiteSettings } from "@/contexts/WebsiteSettingsContext";
import { extractTenantFromHostname } from "@/lib/tenant-utils";
import { motion, AnimatePresence } from "framer-motion";

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
      localStorage.removeItem("onboarding-state");
      localStorage.removeItem("onboarding-completed");
      const tenant = extractTenantFromHostname();
      const signupData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        countryCode: data.countryCode,
        tenant: tenant !== 'main' ? tenant : null
      };
      localStorage.setItem("signup-data", JSON.stringify(signupData));
      toast({
        title: "Node Registration Initialized",
        description: "Commencing neural profile setup.",
      });
      navigate("/onboarding");
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error?.message || "Internal system error.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      {/* Background Orbs */}
      <div className="absolute top-0 left-0 w-[40%] h-[40%] bg-pink-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[30%] h-[30%] bg-purple-500/10 blur-[100px] rounded-full pointer-events-none" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{ backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`, backgroundSize: '40px 40px' }} />

      <div className="w-full max-w-6xl bg-[#0a0b12]/80 backdrop-blur-2xl rounded-[3rem] border border-white/5 shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[700px] relative z-10 animate-in fade-in zoom-in duration-500">

        {/* Info Column (Left on Desktop) */}
        <div className="w-full md:w-[35%] bg-gradient-to-br from-purple-900/40 to-pink-600/20 p-12 text-white flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden border-r border-white/5 order-first">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-pink-500/10 via-transparent to-transparent opacity-50" />

          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 bg-white/5 rounded-2xl border border-white/10 flex items-center justify-center mx-auto mb-4 group hover:border-pink-500 transition-all">
              <Zap className="w-8 h-8 text-pink-500" />
            </div>
            <h2 className="text-4xl font-bold tracking-tighter">WELCOME</h2>
            <p className="text-sm text-white/40 leading-relaxed max-w-[280px] mx-auto font-light font-mono uppercase tracking-widest leading-loose">
              Sync with the world's most advanced neural voice architecture.
            </p>
            <div className="flex flex-col gap-4 pt-4">
              {[
                { icon: Globe, text: "Global Redundancy" },
                { icon: Shield, text: "Zero-Knowledge Encryption" },
                { icon: Zap, text: "Sub-second Latency" }
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 text-left">
                  <item.icon className="w-4 h-4 text-pink-500" />
                  <span className="text-[10px] font-mono tracking-widest text-white/40 uppercase">{item.text}</span>
                </div>
              ))}
            </div>
            <Link to="/login">
              <Button
                variant="outline"
                className="mt-8 rounded-full border border-white/10 bg-white/5 text-white hover:bg-pink-500 hover:text-white hover:border-pink-500 px-12 h-14 uppercase font-bold tracking-widest font-mono text-xs transition-all"
              >
                EXISTING NODE? SIGN IN
              </Button>
            </Link>
          </div>
        </div>

        {/* Form Column */}
        <div className="w-full md:w-[65%] p-8 md:p-14 flex flex-col justify-center">
          <div className="max-w-lg w-full mx-auto space-y-10">
            <div className="text-center">
              <div className="inline-block px-4 py-1.5 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-6 border border-pink-500/20">
                Network Participation
              </div>
              <h1 className="text-4xl font-bold text-white tracking-tighter uppercase">INITIALIZE ACCONT</h1>
            </div>

            {/* Social Logins */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5 opacity-60 group-hover:opacity-100 transition-opacity" />
                <span className="text-[10px] font-mono font-bold text-white/40 group-hover:text-white tracking-widest uppercase">Google Join</span>
              </button>
              <button
                type="button"
                className="flex items-center justify-center gap-3 px-4 py-3 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-all group"
              >
                <div className="w-5 h-5 bg-[#1877f2]/20 rounded-lg flex items-center justify-center border border-[#1877f2]/40">
                  <span className="text-white text-[10px] font-bold">f</span>
                </div>
                <span className="text-[10px] font-mono font-bold text-white/40 group-hover:text-white tracking-widest uppercase">Meta Join</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-4 text-white/20 text-[10px] uppercase font-mono tracking-widest">Protocol Registration</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4" noValidate>
              {/* Full Name */}
              <div className="relative group col-span-2">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-pink-500 transition-colors">
                  <User className="w-5 h-5" />
                </div>
                <input
                  {...register("name")}
                  id="name"
                  type="text"
                  placeholder="IDENTIFIER (NAME)"
                  className="w-full pl-12 pr-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-pink-500/50 outline-none transition-all placeholder:text-white/10 text-white font-mono text-xs tracking-widest"
                />
                {errors.name && (
                  <p className="text-[10px] font-mono text-pink-500 mt-2 pl-2 tracking-widest uppercase">{errors.name.message}</p>
                )}
              </div>

              {/* Email address */}
              <div className="relative group col-span-2">
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
                  <p className="text-[10px] font-mono text-pink-500 mt-2 pl-2 tracking-widest uppercase">{errors.email.message}</p>
                )}
              </div>

              {/* Phone Number */}
              <div className="flex gap-2 col-span-2">
                <Select
                  value={selectedCountry?.code}
                  onValueChange={(value) => {
                    const country = countryCodes.find(c => c.code === value);
                    setSelectedCountry(country || countryCodes[0]);
                    setValue("countryCode", value);
                  }}
                >
                  <SelectTrigger className="w-24 h-14 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-pink-500/50 text-white">
                    <SelectValue>
                      <span>{selectedCountry?.flag}</span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-[#0a0b12] border-white/10">
                    {countryCodes.map((country, index) => (
                      <SelectItem key={`${country.code}-${index}`} value={country.code} className="hover:bg-pink-500/10 focus:bg-pink-500/10 text-white font-mono">
                        <span className="flex items-center gap-2">
                          <span>{country.flag}</span>
                          <span>{country.code}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="flex-1 relative group">
                  <input
                    {...register("phone")}
                    id="phone"
                    type="tel"
                    placeholder="COMMS LINE"
                    className="w-full px-4 py-4 bg-white/5 border border-white/5 rounded-2xl focus:ring-1 focus:ring-pink-500/50 outline-none transition-all placeholder:text-white/10 text-white font-mono text-xs tracking-widest"
                  />
                  {errors.phone && (
                    <p className="text-[10px] font-mono text-pink-500 mt-2 pl-2 tracking-widest uppercase">{errors.phone.message}</p>
                  )}
                </div>
              </div>

              {/* Password */}
              <div className="relative group col-span-2 md:col-span-1">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 group-focus-within:text-pink-500 transition-colors">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  {...register("password")}
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
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
                  <p className="text-[10px] font-mono text-pink-500 mt-2 pl-2 tracking-widest uppercase">{errors.password.message}</p>
                )}
              </div>

              <div className="col-span-2 flex items-start space-x-3 pt-2">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms || false}
                  onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
                  className="mt-1 border-white/20 data-[state=checked]:bg-pink-500 data-[state=checked]:border-pink-500 rounded-md h-5 w-5"
                />
                <Label htmlFor="acceptTerms" className="text-[10px] font-mono text-white/40 leading-relaxed cursor-pointer tracking-widest uppercase">
                  I grant consent for <Link to="/terms" className="text-pink-500 font-bold hover:underline">Neural Terms</Link> & <Link to="/privacy" className="text-pink-500 font-bold hover:underline">Data Protocols</Link>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="col-span-2 text-[10px] font-mono text-pink-500 -mt-1 pl-2 uppercase tracking-widest">{errors.acceptTerms.message}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="col-span-2 h-16 bg-white text-black hover:bg-pink-500 hover:text-white rounded-2xl text-sm font-mono font-bold tracking-[0.3em] uppercase transition-all shadow-2xl active:scale-[0.98] mt-4"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "INITIALIZE REGISTRATION"
                )}
              </Button>
            </form>

            <div className="text-center text-[10px] font-mono tracking-widest text-white/20 uppercase">
              <span>EXISTING ARCHITECTURE? </span>
              <Link to="/login" className="text-pink-500 font-bold hover:text-pink-400 transition-colors">
                SIGN IN
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};