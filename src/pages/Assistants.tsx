import { useState } from 'react';
import DashboardLayout from "@/layout/DashboardLayout";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeContainer } from "@/components/theme";
import { AssistantsTab } from "@/components/assistants/tabs/AssistantsTab";
import { PhoneNumbersTab } from "@/components/assistants/tabs/PhoneNumbersTab";
import { KnowledgeBaseTab } from "@/components/assistants/tabs/KnowledgeBaseTab";
import { Bot, Phone, Database } from "lucide-react";

const tabVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 }
};

export default function Assistants() {
  const [activeTab, setActiveTab] = useState("assistants");
  const [tabChangeTrigger, setTabChangeTrigger] = useState(0);

  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    // Trigger a refresh by incrementing the trigger counter
    setTabChangeTrigger(prev => prev + 1);
  };

  const tabs = [
    { id: "assistants", label: "Agents", icon: Bot },
    { id: "phone-numbers", label: "Phone Numbers", icon: Phone },
    { id: "knowledge-base", label: "Knowledge Base", icon: Database }
  ];


  return (
    <DashboardLayout>
      <ThemeContainer variant="base" className="min-h-screen no-hover-scaling">
        <div className="flex flex-col h-full">
          {/* Top Header Bar */}
          <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
            <div className="max-w-[1920px] mx-auto px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                    Agents
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground mt-1 line-clamp-1">
                    Manage your AI assistants, phone numbers, and knowledge base
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex flex-col lg:flex-row flex-1 overflow-hidden">
            {/* Navigation Tabs - Responsive */}
            <div className="lg:w-64 border-b lg:border-b-0 lg:border-r border-border/40 bg-background/50 backdrop-blur-sm overflow-x-auto lg:overflow-y-auto">
              <div className="flex lg:flex-col p-2 lg:p-4 space-x-2 lg:space-x-0 lg:space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`
                        flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200 whitespace-nowrap
                        ${activeTab === tab.id
                          ? 'bg-primary/10 text-primary border border-primary/20'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                        }
                        lg:w-full
                      `}
                    >
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto bg-muted/20">
              <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    variants={tabVariants}
                    initial="initial"
                    animate="animate"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                  >
                    {activeTab === "assistants" && <AssistantsTab tabChangeTrigger={tabChangeTrigger} />}
                    {activeTab === "phone-numbers" && <PhoneNumbersTab tabChangeTrigger={tabChangeTrigger} />}
                    {activeTab === "knowledge-base" && <KnowledgeBaseTab tabChangeTrigger={tabChangeTrigger} />}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </ThemeContainer>
    </DashboardLayout>
  );
}
