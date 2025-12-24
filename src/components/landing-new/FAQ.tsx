
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
        <div id="faq" className="py-32 bg-[#050505] relative border-t border-white/5">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                <div className="text-center mb-24">
                    <div className="inline-flex items-center gap-3 px-4 py-1.5 bg-pink-500/10 text-pink-500 rounded-full text-[10px] font-mono font-bold uppercase tracking-[0.3em] mb-6 border border-pink-500/20">
                        <HelpCircle className="w-4 h-4" />
                        System Query
                    </div>
                    <h2 className="text-5xl md:text-7xl font-bold text-white mb-8 tracking-tighter leading-[0.9]">
                        SYSTEM <br />
                        <span className="text-white/20">INTELLIGENCE</span>
                    </h2>

                    <p className="text-white/40 text-lg font-light tracking-wide max-w-2xl mx-auto">
                        Decoding the core operational logic of VOKIVO's neural voice deployment.
                    </p>
                </div>

                <div className="max-w-4xl mx-auto bg-[#0a0b12] rounded-[3rem] p-12 shadow-2xl border border-white/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/5 blur-3xl rounded-full -mr-32 -mt-32"></div>

                    <Accordion type="single" collapsible className="w-full">
                        <AccordionItem value="item-1" className="border-b border-white/5 py-6">
                            <AccordionTrigger className="text-2xl font-bold text-white/80 hover:no-underline hover:text-pink-500 transition-colors tracking-tight text-left">
                                What is VOKIVO's Neural Core?
                            </AccordionTrigger>
                            <AccordionContent className="text-white/40 text-lg leading-relaxed pt-6 font-light">
                                VOKIVO is a high-fidelity AI-powered voice assistant platform that architecturally replicates human conversation for lead qualification, booking synchronization, and multi-channel campaign management—operating with sub-second latency 24/7.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-2" className="border-b border-white/5 py-6">
                            <AccordionTrigger className="text-2xl font-bold text-white/80 hover:no-underline hover:text-pink-500 transition-colors tracking-tight text-left">
                                How fast is the deployment cycle?
                            </AccordionTrigger>
                            <AccordionContent className="text-white/40 text-lg leading-relaxed pt-6 font-light">
                                Architectural setup is instantaneous. Authenticate your CRM, configure your neural agent's logic, and map your communication cluster. The platform orchestrates the rest.
                            </AccordionContent>
                        </AccordionItem>

                        <AccordionItem value="item-3" className="border-none py-6">
                            <AccordionTrigger className="text-2xl font-bold text-white/80 hover:no-underline hover:text-pink-500 transition-colors tracking-tight text-left">
                                Scalability & Latency?
                            </AccordionTrigger>
                            <AccordionContent className="text-white/40 text-lg leading-relaxed pt-6 font-light">
                                Our distributed neural engine processes thousands of concurrent voice sessions globally, maintaining a human-like response cadence with extreme redundancy across all communication nodes.
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
};
