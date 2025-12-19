import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import BusinessUseCaseSettings from "./BusinessUseCaseSettings";
import WhitelabelSettings from "./WhitelabelSettings";
import { useAuth } from '@/contexts/SupportAccessAuthContext';
import { getPlanConfigs } from '@/lib/plan-config';

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

interface WorkspaceSettingsProps {
  initialSubTab?: string | null;
}

export function WorkspaceSettings({ initialSubTab }: WorkspaceSettingsProps) {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState(() => {
    const allowedTabs = ['business', 'whitelabel'];
    if (initialSubTab && allowedTabs.includes(initialSubTab)) {
      return initialSubTab;
    }
    return "business";
  });
  const [whitelabelAvailable, setWhitelabelAvailable] = useState(false);
  const [checkingWhitelabel, setCheckingWhitelabel] = useState(true);

  useEffect(() => {
    const determineWhitelabelAccess = async () => {
      try {
        const token = localStorage.getItem('auth_token');
        if (!token) {
          setWhitelabelAvailable(false);
          setCheckingWhitelabel(false);
          return;
        }

        // Fetch user profile from API to get latest plan/role/tenant info
        console.log('[Whitelabel Check] Fetching profile...');
        const response = await fetch('/api/v1/user/profile', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        let profile = null;
        if (response.ok) {
          const data = await response.json();
          profile = data.user;
          console.log('[Whitelabel Check] Profile fetched:', profile);
        } else {
          console.error('[Whitelabel Check] Profile fetch failed:', response.status, response.statusText);
        }

        // Check if user is a whitelabel admin (admin role with slug_name)
        const isWhitelabelAdmin = profile?.role === 'admin' && profile?.slug_name != null;
        console.log('[Whitelabel Check] Role:', profile?.role, 'Slug:', profile?.slug_name, 'Is WL Admin:', isWhitelabelAdmin);

        // If user is a whitelabel admin, grant access
        if (isWhitelabelAdmin) {
          console.log('[Whitelabel Check] Granting access (WL Admin)');
          setWhitelabelAvailable(true);
          setCheckingWhitelabel(false);
          return;
        }

        const planKey = profile?.plan?.toLowerCase() || 'free';
        const tenantFilter = profile?.tenant && profile.tenant !== 'main' ? profile.tenant : null;

        console.log('[Whitelabel Check] Plan key:', planKey, 'Tenant filter:', tenantFilter);

        const configs = await getPlanConfigs(tenantFilter ?? undefined);
        console.log('[Whitelabel Check] All plan configs keys:', Object.keys(configs));

        const planConfig = configs[planKey];
        if (!planConfig) {
          console.warn(`[Whitelabel Check] Plan config not found for key: ${planKey}. Available keys:`, Object.keys(configs));
        }

        const isEnabled = planConfig?.whitelabelEnabled === true;
        console.log('[Whitelabel Check] Selected plan config:', planConfig);
        console.log('[Whitelabel Check] Final Whitelabel Access:', isEnabled);

        setWhitelabelAvailable(isEnabled);
      } catch (error) {
        console.error('[Whitelabel Check] Error checking whitelabel access:', error);
        setWhitelabelAvailable(false);
      } finally {
        setCheckingWhitelabel(false);
      }
    };

    determineWhitelabelAccess();
  }, [user]);

  useEffect(() => {
    if (initialSubTab === 'whitelabel' && whitelabelAvailable) {
      setActiveSubTab('whitelabel');
    }
  }, [initialSubTab, whitelabelAvailable]);

  useEffect(() => {
    if (!whitelabelAvailable && activeSubTab === 'whitelabel') {
      setActiveSubTab('business');
    }
  }, [whitelabelAvailable, activeSubTab]);

  const subTabs = [

    { id: "business", label: "Business Use Case" },
    ...(whitelabelAvailable ? [{ id: "whitelabel", label: "Whitelabel" }] : [])
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extralight tracking-tight text-foreground">Workspace Settings</h2>
        <p className="mt-2 text-muted-foreground leading-relaxed">
          Manage billing, integrations, and workspace-wide settings
        </p>
      </div>

      {/* Sub-tabs for Workspace */}
      <div className="border-b border-border/50">
        <nav className="flex gap-1">
          {subTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`
                relative px-4 py-3 text-sm font-medium transition-all duration-300
                ${activeSubTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground/80'
                }
              `}
            >
              {tab.label}
              {activeSubTab === tab.id && (
                <motion.div
                  layoutId="activeSubTab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                  initial={false}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>
      </div>

      {/* Sub-tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          variants={tabVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === "business" && <BusinessUseCaseSettings />}
          {activeSubTab === "whitelabel" && whitelabelAvailable && <WhitelabelSettings />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}