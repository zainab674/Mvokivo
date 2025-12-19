
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from "@/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { AccountSettings } from "@/components/settings/AccountSettings";
import { WorkspaceSettings } from "@/components/settings/WorkspaceSettings";
import { PlansAndPricingSettings } from "@/components/settings/PlansAndPricingSettings";
import { ApiIntegrations } from "@/components/settings/ApiIntegrations";
import { ThemeContainer, ThemeSection, ThemeCard } from "@/components/theme";

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export default function Settings() {
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("account");

  useEffect(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam && ['account', 'workspace', 'integrations', 'plans'].includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [searchParams]);

  const tabs = [
    { id: "account", label: "Account" },
    { id: "workspace", label: "Workspace" },
    { id: "integrations", label: "Integrations" },
  ];


  return (
    <DashboardLayout>
      <ThemeContainer variant="base" className="min-h-screen no-hover-scaling">
        <div className="container mx-auto px-4 sm:px-[var(--space-lg)]">
          <div className="max-w-5xl mx-auto py-6 sm:py-8">
            <ThemeSection spacing="lg">
              <div className="flex flex-col space-y-2 sm:space-y-[var(--space-md)] mb-6 sm:mb-0">
                <h1 className="text-3xl sm:text-4xl font-extralight tracking-tight text-foreground">
                  Settings
                </h1>
                <p className="text-muted-foreground text-base sm:text-lg font-light">
                  Manage your account settings and preferences
                </p>
              </div>

              <ThemeCard variant="glass" className="overflow-hidden">
                <div className="border-b border-white/[0.08] overflow-x-auto no-scrollbar">
                  <nav className="flex gap-1 min-w-max px-2 sm:px-6">
                    {tabs.map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`
                          relative px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium transition-all duration-300
                          ${activeTab === tab.id
                            ? 'text-foreground'
                            : 'text-muted-foreground hover:text-foreground/80'
                          }
                        `}
                      >
                        {tab.label}
                        {activeTab === tab.id && (
                          <motion.div
                            layoutId="activeTab"
                            className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                            initial={false}
                            transition={{ type: "spring", stiffness: 380, damping: 30 }}
                          />
                        )}
                      </button>
                    ))}
                  </nav>
                </div>

                <div className="p-4 sm:p-8">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      variants={tabVariants}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      transition={{ duration: 0.2 }}
                    >
                      {activeTab === "account" && <AccountSettings initialSubTab={searchParams.get('subtab')} />}
                      {activeTab === "workspace" && <WorkspaceSettings initialSubTab={searchParams.get('subtab')} />}
                      {activeTab === "integrations" && <ApiIntegrations />}
                      {activeTab === "plans" && <PlansAndPricingSettings />}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </ThemeCard>
            </ThemeSection>
          </div>
        </div>
      </ThemeContainer>
    </DashboardLayout>
  );
}
