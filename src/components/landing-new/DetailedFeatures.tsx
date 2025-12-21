
import React from 'react';
import { MousePointer2, Zap, BarChart3, Globe } from "lucide-react";

export const DetailedFeatures = () => {
    return (
        <div id="features" className="py-24 bg-white">
            <div className="container mx-auto px-6 md:px-12 lg:px-24">
                {/* Header */}
                <div className="text-center max-w-3xl mx-auto mb-20">
                    <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
                        Intelligent AI Voice Platform <br />
                        <span className="text-purple-600">for Calls, Bookings & Lead Automation</span>
                    </h2>
                    <p className="text-gray-600 text-lg">
                        VOKIVO replaces traditional business calling with AI-powered voice agents that talk to leads,
                        book meetings, collect data, run campaigns, and automate follow-ups — all without human effort.
                    </p>
                </div>

                {/* Section 1 */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-purple-600">
                            <MousePointer2 className="w-5 h-5" />
                            <span className="font-semibold text-sm uppercase tracking-wider">AI Auto Dialer</span>
                        </div>

                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                            AI voice agents that <br /> call leads for you
                        </h3>
                        <p className="text-gray-600 text-lg mb-8">
                            VOKIVO’s AI auto dialer automatically calls prospects, handles conversations naturally,
                            qualifies leads, and routes hot opportunities — eliminating manual dialing completely.
                        </p>
                    </div>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-purple-200 rounded-3xl blur-2xl opacity-20 transform -rotate-3 transition-transform group-hover:rotate-0"></div>
                        <div className="relative bg-white p-4 rounded-3xl border border-gray-100 shadow-2xl">
                            <img
                                src="/dashboard_mockup.png"
                                alt="Dashboard"
                                className="rounded-2xl border border-gray-50"
                            />
                            {/* Floating UI Elements */}
                            <div className="absolute -top-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-gray-50 max-w-[200px] animate-bounce-slow">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold italic">CE</div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">Cathy Edwards</p>
                                        <p className="text-[10px] text-gray-500">Active now</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Section 2 */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                    <div className="order-2 md:order-1 relative">
                        <div className="absolute inset-0 bg-purple-200 rounded-full blur-3xl opacity-20 transform scale-75"></div>
                        {/* <img
                            src="/female_holding_phone.png"
                            alt="Lead Matching"
                            className="relative z-10 w-[80%] mx-auto"
                        /> */}
                        <div className="absolute top-[40%] left-0 bg-white p-4 rounded-2xl shadow-xl border border-gray-100 max-w-[220px]">
                            <div className="flex flex-col gap-3">
                                <div className="flex justify-between items-center bg-purple-50 p-2 rounded-lg">
                                    <span className="font-semibold text-sm uppercase tracking-wider">Smart Agents</span>
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                </div>
                                <div className="flex justify-between items-center bg-gray-50 p-2 rounded-lg">
                                    <span className="text-xs font-semibold">24/7 Active</span>
                                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="order-1 md:order-2">
                        <div className="flex items-center gap-2 mb-4 text-purple-600">
                            <Zap className="w-5 h-5" />
                            <span className="font-semibold text-sm uppercase tracking-wider">Matching System</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                            Intelligent lead <br /> routing & qualification
                        </h3>
                        <p className="text-gray-600 text-lg mb-8">
                            VOKIVO analyzes every conversation in real time, scores leads, captures intent,
                            and routes them to the right workflow — booking, follow-up, or campaign nurturing.
                        </p>
                    </div>
                </div>

                {/* Section 3 */}
                <div className="grid md:grid-cols-2 gap-16 items-center mb-32">
                    <div>
                        <div className="flex items-center gap-2 mb-4 text-purple-600">
                            <BarChart3 className="w-5 h-5" />
                            <span className="font-semibold text-sm uppercase tracking-wider">Monitoring</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                            Call logs, recordings & <br /> conversation insights
                        </h3>
                        <p className="text-gray-600 text-lg mb-8">
                            Every call is recorded, transcribed, and analyzed automatically.
                            Track outcomes, monitor performance, and improve conversations using real insights.
                        </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-purple-100 p-8 rounded-3xl flex items-center justify-center">
                            <div className="w-24 h-24 border-8 border-purple-500 border-t-purple-200 rounded-full animate-spin-slow"></div>
                        </div>
                        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-xl flex flex-col justify-center gap-4">
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-purple-600 cursor-pointer transition-colors">
                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">🎧</div>
                                Listen In
                            </div>
                            <div className="flex items-center gap-2 text-sm font-bold text-gray-700 hover:text-purple-600 cursor-pointer transition-colors">
                                <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">💬</div>
                                Whisper to Agent
                            </div>
                        </div>
                        <div className="col-span-2 bg-purple-600 p-6 rounded-3xl text-white">
                            <div className="flex items-center gap-4 mb-4">
                                <div className="flex -space-x-4">
                                    {[1, 2, 3].map(i => (
                                        <img key={i} src={`https://i.pravatar.cc/150?u=${i}`} className="w-10 h-10 rounded-full border-2 border-purple-600" />
                                    ))}
                                </div>
                                <span className="text-sm font-bold">Agents on call</span>
                            </div>
                            <div className="h-12 flex items-center justify-center gap-1">
                                {[...Array(20)].map((_, i) => (
                                    <div key={i} className="w-1 bg-white/40 rounded-full transition-all" style={{ height: `${Math.random() * 100}%` }}></div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>


            </div>
        </div>
    );
};
