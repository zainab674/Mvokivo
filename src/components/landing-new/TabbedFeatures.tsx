
import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2 } from "lucide-react";

const tabs = [
    {
        id: 'automation',
        label: 'AI Workflow Automation',
        title: 'Automate Conversations & Follow-ups',
        description:
            'Let VOKIVO handle calls, lead qualification, bookings, and email follow-ups automatically so your team focuses only on high-intent customers.',
    },
    {
        id: 'filtering',
        label: 'Compliance & Number Filtering',
        title: 'Built-in Call Compliance',
        description:
            'VOKIVO automatically filters DNC and DND numbers before dialing, keeping your outbound campaigns compliant and risk-free.',
    },
    {
        id: 'crm',
        label: 'CRM & Tool Integrations',
        title: 'All Lead Data in One Place',
        description:
            'Sync VOKIVO with your CRM and tools to store call logs, lead details, conversation outcomes, and booking history seamlessly.',
    },
    {
        id: 'analytics',
        label: 'Conversation Intelligence',
        title: 'AI-Powered Call Insights',
        description:
            'Analyze voice conversations to detect intent, keywords, sentiment, and conversion signals using VOKIVO’s built-in speech intelligence.',
    },
    {
        id: 'reporting',
        label: 'Performance Dashboards',
        title: 'Track What Converts',
        description:
            'Monitor calls, campaigns, bookings, and agent performance in real time with clean, easy-to-understand dashboards.',
    },
    {
        id: 'sms',
        label: 'Email & Message Automation',
        title: 'Multi-Channel Follow-ups',
        description:
            'Automatically send emails and messages after calls, manage replies, and keep leads engaged until they convert.',
    },
];


export const TabbedFeatures = () => {
    const [activeTab, setActiveTab] = useState(tabs[0]);

    return (
        <div className="py-24 bg-gray-50/50">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="flex flex-col lg:flex-row gap-12 bg-white rounded-[40px] shadow-2xl p-8 lg:p-12 overflow-hidden border border-gray-100">
                    {/* Sidebar Tabs */}
                    <div className="lg:w-1/3 flex flex-col gap-2">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab)}
                                className={`flex items-center justify-between px-6 py-6 rounded-2xl transition-all text-left group ${activeTab.id === tab.id
                                    ? 'bg-purple-600 text-white shadow-lg'
                                    : 'hover:bg-purple-50 text-gray-700'
                                    }`}
                            >
                                <span className="font-bold text-lg">{tab.label}</span>
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center border ${activeTab.id === tab.id ? 'border-white/40 bg-white/20' : 'border-gray-200 group-hover:border-purple-200'
                                    }`}>
                                    <div className={`w-2 h-2 rounded-full ${activeTab.id === tab.id ? 'bg-white' : 'bg-gray-200 group-hover:bg-purple-400'}`}></div>
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Content Area */}
                    <div className="lg:w-2/3 relative min-h-[500px] flex items-center">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.3 }}
                                className="w-full"
                            >
                                <div className="max-w-xl">
                                    <h3 className="text-4xl font-bold text-gray-900 mb-6">{activeTab.title}</h3>
                                    <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                                        {activeTab.description}
                                    </p>

                                    <div className="grid grid-cols-2 gap-4 mb-10">
                                        {['Save up to 40% time', 'Increase reach by 5x', 'Real-time sync', 'Easy setup'].map((item) => (
                                            <div key={item} className="flex items-center gap-2">
                                                <CheckCircle2 className="w-5 h-5 text-purple-600" />
                                                <span className="text-gray-700 font-medium">{item}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="relative mt-8 group">
                                        <div className="absolute inset-0 bg-purple-600 rounded-3xl blur-3xl opacity-10 group-hover:opacity-20 transition-opacity"></div>
                                        <div className="relative bg-purple-50/50 p-6 rounded-3xl border border-purple-100 flex items-center gap-6">

                                            <div>
                                                <h4 className="font-bold text-gray-900 mb-1">Interactive Previews</h4>
                                                <p className="text-sm text-gray-500">See how {activeTab.label} works in real-time with our live demo environment.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </div>
    );
};
