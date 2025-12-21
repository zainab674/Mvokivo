
import React from 'react';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { HelpCircle } from "lucide-react";

export const FAQ = () => {
    return (
        <div id="faq" className="py-24 bg-gray-50/50">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="text-center mb-16">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-purple-100 text-purple-700 rounded-full text-xs font-bold uppercase tracking-widest mb-4">
                        <HelpCircle className="w-4 h-4" />
                        Frequently Asked
                    </div>
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Frequently asked questions about <br /> <span className="text-purple-600">VOKIVO</span>
                    </h2>

                    <p className="text-gray-500 text-lg">
                        Quick answers to the most common questions about our AI voice assistant platform.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto bg-white rounded-[32px] p-8 shadow-xl border border-gray-100">
                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-b border-gray-100 py-4">
                            <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline hover:text-purple-600 transition-colors">
                                What is VOKIVO?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 text-lg leading-relaxed pt-4">
                                VOKIVO is an AI-powered voice assistant platform that lets businesses create smart AI agents
                                to call leads, handle conversations, book appointments, run campaigns, and manage follow-ups
                                through calls and email — all automatically.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border-b border-gray-100 py-4">
                            <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline hover:text-purple-600 transition-colors">
                                How do I get started with VOKIVO?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 text-lg leading-relaxed pt-4">
                                Simply sign up, create your AI agent, assign a phone number, connect your calendar or email,
                                and launch your first campaign. No complex setup or technical knowledge required.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="border-none py-4">
                            <AccordionTrigger className="text-xl font-bold text-gray-900 hover:no-underline hover:text-purple-600 transition-colors">
                                What can VOKIVO do for my business?
                            </AccordionTrigger>
                            <AccordionContent className="text-gray-600 text-lg leading-relaxed pt-4">
                                VOKIVO can automatically call and qualify leads, book meetings, collect customer information,
                                send follow-up emails, manage replies, and turn conversations into real conversions — 24/7.
                            </AccordionContent>

                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
};
