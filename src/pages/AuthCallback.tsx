import { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/SupportAccessAuthContext";

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  // Function to check onboarding status and redirect appropriately
  const checkOnboardingAndRedirect = useCallback(async () => {
    try {
      // Wait a moment for user data to be available
      await new Promise(resolve => setTimeout(resolve, 500));

      if (!user) {
        // If no user, go to login
        setTimeout(() => navigate("/login"), 1500);
        return;
      }

      // Check onboarding status from localStorage
      const localCompleted = localStorage.getItem("onboarding-completed") === "true";

      // Redirect based on onboarding status
      setTimeout(() => {
        if (localCompleted) {
          navigate("/dashboard");
        } else {
          // Clear any stale localStorage flag
          localStorage.removeItem("onboarding-completed");
          navigate("/onboarding");
        }
      }, 1500);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      // On error, default to onboarding to be safe
      setTimeout(() => {
        localStorage.removeItem("onboarding-completed");
        navigate("/onboarding");
      }, 1500);
    }
  }, [navigate, user]);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Check for error in URL params
        const error = searchParams.get("error");
        const errorDescription = searchParams.get("error_description");

        // If there's an error, handle it
        if (error) {
          console.error("Auth error:", error, errorDescription);

          setStatus("error");
          toast({
            title: "Authentication failed",
            description: errorDescription || "An error occurred during authentication.",
            variant: "destructive",
          });
          setTimeout(() => {
            navigate("/login");
          }, 2000);
          return;
        }

        // Check for token in URL (email verification)
        const token = searchParams.get("token");
        const type = searchParams.get("type");

        if (type === "recovery") {
          // Password reset flow
          navigate("/reset-password");
          return;
        }

        if (token) {
          // Handle token-based confirmation (email verification)
          try {
            const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
            const response = await fetch(`${apiUrl}/api/v1/user/verify-email?token=${token}`, {
              method: 'GET',
              redirect: 'follow'
            });

            if (response.ok) {
              setStatus("success");
              toast({
                title: "Email confirmed!",
                description: "Your email has been successfully verified.",
              });
              await checkOnboardingAndRedirect();
            } else {
              throw new Error("Verification failed");
            }
          } catch (tokenError) {
            console.error("Token verification error:", tokenError);
            setStatus("error");
            toast({
              title: "Verification failed",
              description: "This verification link is invalid or has expired.",
              variant: "destructive",
            });
            setTimeout(() => {
              navigate("/login?expired=true");
            }, 2000);
          }
        } else {
          // No tokens found, check if user is already authenticated
          if (user) {
            setStatus("success");
            await checkOnboardingAndRedirect();
          } else {
            setStatus("error");
            toast({
              title: "Invalid link",
              description: "This link is invalid or has expired.",
              variant: "destructive",
            });
            setTimeout(() => {
              navigate("/login");
            }, 2000);
          }
        }
      } catch (error: any) {
        console.error("Auth callback error:", error);
        setStatus("error");
        toast({
          title: "Authentication failed",
          description: error?.message || "An error occurred during authentication.",
          variant: "destructive",
        });

        setTimeout(() => {
          navigate("/login");
        }, 2000);
      }
    };

    handleAuthCallback();
  }, [searchParams, navigate, toast, user, checkOnboardingAndRedirect]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center">
        {status === "loading" && (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Processing...</p>
          </>
        )}
        {status === "success" && (
          <>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-foreground font-medium">Success!</p>
            <p className="text-muted-foreground text-sm mt-2">Setting up your account...</p>
          </>
        )}
        {status === "error" && (
          <>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <p className="text-foreground font-medium">Authentication failed</p>
            <p className="text-muted-foreground text-sm mt-2">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}

