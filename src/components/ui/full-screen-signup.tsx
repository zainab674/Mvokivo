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
import { Eye, EyeOff, Loader2, ArrowRight, Sparkles, Shield, Zap, User, Mail, Lock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useWebsiteSettings } from "@/contexts/WebsiteSettingsContext";
import { extractTenantFromHostname } from "@/lib/tenant-utils";

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

      // Extract tenant from current hostname (subdomain)
      const tenant = extractTenantFromHostname();

      // Store signup data in localStorage instead of creating auth user
      // User will be created after onboarding is complete
      const signupData = {
        name: data.name,
        email: data.email,
        password: data.password,
        phone: data.phone,
        countryCode: data.countryCode,
        tenant: tenant !== 'main' ? tenant : null // Include tenant if on whitelabel subdomain
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
    <div className="min-h-screen bg-[#f0f2f5] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="fixed inset-0 bg-[#7c3aed] opacity-90 z-0" />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_50%_50%,_rgba(255,255,255,0.1)_0%,_transparent_50%)] z-0" />

      <div className="w-full max-w-5xl bg-white rounded-[30px] shadow-2xl overflow-hidden flex flex-col md:flex-row min-h-[650px] relative z-10">

        {/* Left Side - Form (White) */}
        <div className="w-full md:w-[60%] bg-white p-8 md:p-14 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto space-y-8">
            <div className="text-center">
              <h1 className="text-4xl font-bold text-[#7c3aed]">Create Account</h1>
            </div>

            {/* Social Logins */}
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="Google" className="w-5 h-5" />
                <span className="text-sm font-medium text-gray-500">Sign in with google</span>
              </button>
              <button
                type="button"
                className="flex items-center gap-2 px-4 py-2 border border-gray-100 rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="w-5 h-5 bg-[#1877f2] rounded flex items-center justify-center">
                  <span className="text-white text-[10px] font-bold">f</span>
                </div>
                <span className="text-sm font-medium text-gray-500">Sign in with facebook</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <div className="flex-grow border-t border-gray-100"></div>
              <span className="flex-shrink mx-4 text-gray-400 text-xs uppercase">or use your email address for registration</span>
              <div className="flex-grow border-t border-gray-100"></div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div className="space-y-3">
                {/* Full Name */}
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7c3aed] transition-colors">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    {...register("name")}
                    id="name"
                    type="text"
                    placeholder="Name"
                    className="w-full pl-12 pr-4 py-3 bg-[#f0f2f5] border-none rounded-xl focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all placeholder:text-gray-400"
                  />
                  {errors.name && (
                    <p className="text-[10px] text-red-500 mt-1 pl-2">{errors.name.message}</p>
                  )}
                </div>

                {/* Email address */}
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7c3aed] transition-colors">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    {...register("email")}
                    id="email"
                    type="email"
                    placeholder="Email address"
                    className="w-full pl-12 pr-4 py-3 bg-[#f0f2f5] border-none rounded-xl focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all placeholder:text-gray-400"
                  />
                  {errors.email && (
                    <p className="text-[10px] text-red-500 mt-1 pl-2">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone Number */}
                <div className="flex gap-2">
                  <Select
                    value={selectedCountry?.code}
                    onValueChange={(value) => {
                      const country = countryCodes.find(c => c.code === value);
                      setSelectedCountry(country || countryCodes[0]);
                      setValue("countryCode", value);
                    }}
                  >
                    <SelectTrigger className="w-24 h-12 bg-[#f0f2f5] border-none rounded-xl focus:ring-2 focus:ring-[#7c3aed]/20">
                      <SelectValue>
                        <span className="text-base">{selectedCountry?.flag}</span>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white">
                      {countryCodes.map((country, index) => (
                        <SelectItem key={`${country.code}-${index}`} value={country.code}>
                          <span className="flex items-center gap-2">
                            <span>{country.flag}</span>
                            <span className="font-medium">{country.code}</span>
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
                      placeholder="Phone number"
                      className="w-full px-4 py-3 bg-[#f0f2f5] border-none rounded-xl focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all placeholder:text-gray-400"
                    />
                    {errors.phone && (
                      <p className="text-[10px] text-red-500 mt-1 pl-2">{errors.phone.message}</p>
                    )}
                  </div>
                </div>

                {/* Password */}
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-[#7c3aed] transition-colors">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    {...register("password")}
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    className="w-full pl-12 pr-12 py-3 bg-[#f0f2f5] border-none rounded-xl focus:ring-2 focus:ring-[#7c3aed]/20 outline-none transition-all placeholder:text-gray-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                  {errors.password && (
                    <p className="text-[10px] text-red-500 mt-1 pl-2">{errors.password.message}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start space-x-3 pt-2">
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms || false}
                  onCheckedChange={(checked) => setValue("acceptTerms", checked as boolean)}
                  className="mt-1 border-gray-300 data-[state=checked]:bg-[#7c3aed] data-[state=checked]:border-[#7c3aed]"
                />
                <Label htmlFor="acceptTerms" className="text-[11px] text-gray-500 leading-relaxed cursor-pointer">
                  I agree to the <Link to="/terms" className="text-[#7c3aed] font-semibold hover:underline">Terms of Service</Link> and <Link to="/privacy" className="text-[#7c3aed] font-semibold hover:underline">Privacy Policy</Link>
                </Label>
              </div>
              {errors.acceptTerms && (
                <p className="text-[10px] text-red-500 -mt-1 pl-2">{errors.acceptTerms.message}</p>
              )}

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-[#7c3aed] hover:bg-[#6d28d9] text-white rounded-full text-lg font-bold shadow-lg shadow-[#7c3aed]/20 transition-all active:scale-[0.98] uppercase tracking-wider mt-4"
              >
                {isLoading ? (
                  <Loader2 className="h-6 w-6 animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </Button>
            </form>

            <div className="text-center text-sm text-gray-500">
              <span>Already have an account? </span>
              <Link to="/login" className="text-[#7c3aed] font-bold hover:underline">
                Log In
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side - Info (Purple) */}
        <div className="w-full md:w-[40%] bg-gradient-to-br from-[#7c3aed] to-[#6d28d9] p-12 text-white flex flex-col items-center justify-center text-center space-y-8 relative overflow-hidden order-first md:order-last">
          {/* Animated Background Waves */}
          <div className="absolute inset-0 opacity-20 transform scale-x-[-1]">
            <svg viewBox="0 0 1000 1000" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <path d="M0,1000 C300,800 400,950 700,700 C900,500 1000,600 1000,0 L0,0 Z" fill="white" opacity="0.1" />
              <path d="M1000,1000 C700,800 600,950 300,700 C100,500 0,600 0,0 L1000,0 Z" fill="white" opacity="0.05" />
            </svg>
          </div>

          <div className="relative z-10 space-y-4">
            <h2 className="text-4xl font-bold">Welcome</h2>
            <p className="text-sm opacity-90 leading-relaxed max-w-[250px] mx-auto">
              To keep connected with us and get latest update, please log in with your gmail or facebook or email address
            </p>
            <Link to="/login">
              <Button
                variant="outline"
                className="mt-8 rounded-full border-2 border-white bg-transparent text-white hover:bg-white hover:text-[#7c3aed] px-10 h-12 uppercase font-bold transition-all"
              >
                Log In
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};