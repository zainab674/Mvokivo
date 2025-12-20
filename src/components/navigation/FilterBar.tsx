import React from "react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";

import TimeRangeSelector from "@/components/dashboard/TimeRangeSelector";
import { useNavigate, useLocation } from "react-router-dom";
import { useTheme } from "@/components/ThemeProvider";
import { useAuth } from "@/contexts/SupportAccessAuthContext";
import { BACKEND_URL } from "@/lib/api-config";

interface FilterBarProps {
  onRangeChange: (range: { from: Date; to: Date }) => void;
  title?: string;
  subtitle?: string;
}

export default function FilterBar({
  onRangeChange,
  title,
  subtitle
}: FilterBarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { uiStyle } = useTheme();
  const { user, getAccessToken } = useAuth();

  const {
    data: userData
  } = useQuery({
    queryKey: ['user-profile', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/me`, {
          headers: {
            'Authorization': `Bearer ${await getAccessToken()}`
          }
        });

        if (!response.ok) {
          console.error('Error fetching user profile:', response.statusText);
          return null;
        }

        const { user: profile } = await response.json();

        // console.log('Raw profile data:', profile);
        if (profile?.name) {
          // console.log('Using name directly from users table:', profile.name);
          return {
            firstName: profile.name
          };
        }
        if (profile?.contact) {
          // ... (keep logic if contact is present)
          // But since we are migrating, we might simplify.
          // Let's keep logic for safety if data is migrating.
          let contactData;
          if (typeof profile.contact === 'string') {
            try {
              contactData = JSON.parse(profile.contact);
            } catch (e) {
              contactData = { firstName: profile.contact };
            }
          } else {
            contactData = profile.contact;
          }
          const firstName = contactData?.firstName || contactData?.first_name || contactData?.name || 'User';
          return { firstName };
        }

        // Use email username as fallback
        if (profile?.email) {
          return { firstName: profile.email.split('@')[0] };
        }

        return {
          firstName: 'User'
        };
      } catch (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }
    },
    enabled: !!user?.id
  });

  // Handle date range changes and share them with the Calls page
  const handleRangeChange = (range: { from: Date; to: Date }) => {
    onRangeChange(range);

    // Store the date range in session storage for persistence
    sessionStorage.setItem('dashboardDateRange', JSON.stringify({
      from: range.from.toISOString(),
      to: range.to.toISOString()
    }));

    // If we're on the dashboard, update the current state for the Calls page to use later
    if (location.pathname === '/') {
      sessionStorage.setItem('lastDashboardDateRange', JSON.stringify({
        from: range.from.toISOString(),
        to: range.to.toISOString()
      }));
    }
  };

  // Get theme-aware background classes
  const getBackgroundClass = () => {
    if (uiStyle === "glass") {
      return "backdrop-blur-sm";
    } else {
      return "surface-base";
    }
  };

  return <motion.div className={`${getBackgroundClass()} px-6 py-6`} initial={{
    opacity: 0,
    y: -10
  }} animate={{
    opacity: 1,
    y: 0
  }} transition={{
    duration: 0.3,
    delay: 0.1
  }}>
    <div className="container mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-extralight tracking-tight text-3xl text-foreground">
            Welcome back!
          </h1>
        </div>

        <div className="flex items-center">
          <div className="liquid-glass-medium liquid-rounded-lg border border-white/10">
            <TimeRangeSelector onRangeChange={handleRangeChange} />
          </div>
        </div>
      </div>
    </div>
  </motion.div>;
}
