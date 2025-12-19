import React from "react";
import { motion } from "framer-motion";
import { Play, PhoneOff, Clock, User, MessageCircle, X, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssistantFormData } from "./types";

interface FlowPreviewProps {
    formData: AssistantFormData;
}

export const FlowPreview: React.FC<FlowPreviewProps> = ({ formData }) => {
    return (
        <div className="h-full w-full bg-[#f8fafc] dark:bg-zinc-950/20 rounded-3xl border border-border/50 p-8 flex flex-col items-center relative overflow-hidden">
            {/* Background Dotted Pattern */}
            <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05] pointer-events-none"
                style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            <div className="w-full max-w-md space-y-8 relative z-10 py-4">
                <p className="text-zinc-500 text-xs font-medium mb-4">Your selected Agent</p>

                {/* Agent Card */}
                <div className="relative">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-zinc-100 dark:border-zinc-800 flex items-center gap-4"
                    >
                        <div className="h-20 w-20 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center overflow-hidden border-2 border-emerald-500/20">
                            <User className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div className="flex-1">
                            <h4 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">{formData.name || "Unnamed Agent"}</h4>
                            <p className="text-sm text-zinc-500">{formData.voice.provider || "Standard"} • {formData.model.language === 'en-es' ? 'Bilingual' : 'English'}</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20 cursor-pointer hover:scale-105 transition-transform">
                            <Play className="w-5 h-5 fill-current ml-0.5" />
                        </div>
                    </motion.div>

                    {/* Connector Down */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-px h-8 bg-zinc-200 dark:bg-zinc-800 border-dashed border-l" />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {/* First Message Box */}
                <div className="relative pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800"
                    >
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2">First message (greeting agent will use)</p>
                        <p className="text-sm text-zinc-700 dark:text-zinc-300 italic leading-relaxed">
                            "{formData.model.firstMessage || "Hi! Thanks for calling. How can I assist you today?"}"
                        </p>
                    </motion.div>

                    {/* Connector Down */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-px h-8 bg-zinc-200 dark:bg-zinc-800 border-dashed border-l" />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {/* Priority Instructions Box */}
                <div className="relative pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-5 shadow-sm border border-zinc-100 dark:border-zinc-800"
                    >
                        <p className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold mb-2">Priority Instructions</p>
                        <p className="text-[10px] text-zinc-500 mb-3 italic">These instructions will guide the agent</p>

                        <div className="space-y-3 max-h-[200px] overflow-hidden relative">
                            <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed whitespace-pre-wrap">
                                {formData.model.systemPrompt || "No instructions provided yet."}
                            </div>
                            <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-white dark:from-zinc-900 to-transparent" />
                        </div>

                        <div className="mt-4 flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-100 dark:border-emerald-800/50 w-fit">
                            <Clock className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300">ideal call length is: 3 Minutes</span>
                        </div>
                    </motion.div>

                    {/* Connector Down */}
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-px h-8 bg-zinc-200 dark:bg-zinc-800 border-dashed border-l" />
                    <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-zinc-200 dark:bg-zinc-800" />
                </div>

                {/* Fallback Number Box */}
                <div className="relative pt-4">
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="bg-white dark:bg-zinc-900 rounded-2xl p-4 shadow-sm border border-rose-100 dark:border-rose-900/30 flex items-center justify-between"
                    >
                        <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                                <PhoneOff className="w-4 h-4 text-rose-500" />
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider text-rose-400 font-bold">Fallback Number</p>
                                <p className="text-xs font-bold text-zinc-800 dark:text-zinc-100">
                                    {formData.advanced.transferPhoneNumber || "(210) 405-5108"}
                                </p>
                            </div>
                        </div>
                        <div className="h-6 w-6 rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center cursor-pointer">
                            <X className="w-3 h-3 text-rose-500" />
                        </div>
                    </motion.div>
                </div>

            </div>
        </div>
    );
};
