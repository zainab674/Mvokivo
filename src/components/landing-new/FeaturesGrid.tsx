
import React from 'react';
import {
    PhoneCall, Users, BarChart3, Target,
    Activity, ListFilter, MessageSquare,
    Eye, ShieldAlert, Wifi, FileText, Share2
} from "lucide-react";

const featureItems = [
    { icon: PhoneCall, label: 'Smart Caller ID' },
    { icon: Users, label: 'AI Lead Qualification' },
    { icon: BarChart3, label: 'Conversation Intelligence' },
    { icon: Target, label: 'Lead Routing & Assignment' },
    { icon: Wifi, label: 'Number Health & Reachability' },
    { icon: ListFilter, label: 'Intelligent Call Queues' },
    { icon: MessageSquare, label: 'Automated Messages & Emails' },
    { icon: Eye, label: 'Live Call Monitoring' },
    { icon: ShieldAlert, label: 'Spam & Risk Detection' },
    { icon: Activity, label: 'Voicemail Detection' },
    { icon: FileText, label: 'Custom Reports & Logs' },
    { icon: Share2, label: 'CRM & Tool Integrations' },
];


export const FeaturesGrid = () => {
    return (
        <div className="py-24 bg-white">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="text-center mb-20">
                    <div className="inline-block px-4 py-1.5 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                        Platform Features
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900">
                        AI voice features your <br /> <span className="text-purple-600">business will love</span>
                    </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {featureItems.map((item, index) => (
                        <div
                            key={index}
                            className="group bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-purple-200 transition-all cursor-default flex items-center gap-4"
                        >
                            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-all">
                                <item.icon className="w-6 h-6" />
                            </div>
                            <span className="font-bold text-gray-800 text-lg group-hover:text-purple-700 transition-all">{item.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
