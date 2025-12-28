
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from "@/components/ui/button";
import { PhoneOff, Loader2, Mic, MicOff } from "lucide-react";
import { createLivekitToken } from "@/lib/api/apiService";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    StartAudio,
    useLocalParticipant,
    useRoomContext,
    useTracks,
} from "@livekit/components-react";
import { Track } from "livekit-client";


const RobotHead = ({ delay, isTalking, tilt = 0, zIndex = 0, xOffset = 0 }: { delay: number; isTalking?: boolean; tilt?: number; zIndex?: number; xOffset?: number }) => {
    return (
        <motion.div
            initial={{ opacity: 1, scale: 1, rotateY: -30 }}
            animate={{
                rotateY: isTalking ? [-15, 15, -15] : [-30, -50, -30],
                rotateX: isTalking ? [tilt - 20, tilt + 20, tilt - 20] : [tilt - 10, tilt + 10, tilt - 10],
                rotateZ: isTalking ? [-10, 10, -10] : [xOffset / 10, -xOffset / 10, xOffset / 10],
                y: [0, -120, 0],
            }}
            transition={{
                duration: isTalking ? 5 : 12,
                repeat: Infinity,
                delay: delay,
                ease: "easeInOut"
            }}
            className="relative w-56 h-56 preserve-3d group cursor-pointer"
            style={{ perspective: '1200px', zIndex }}
        >

            <div className="absolute inset-0 bg-[#212435] rounded-[3rem] border-t-2 border-l-2 border-white/10 shadow-[20px_20px_60px_rgba(0,0,0,0.8),inset_5px_5px_15px_rgba(255,255,255,0.1),inset_-10px_-10px_30px_rgba(236,72,153,0.1)] overflow-hidden border-r-[12px] border-b-[8px] border-black/30">

                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-pink-500/20 to-transparent pointer-events-none" />
                <div className="absolute inset-y-0 left-0 w-12 bg-gradient-to-r from-blue-500/10 to-transparent pointer-events-none" />

                <div className="absolute inset-4 bg-[#0a0b12] rounded-[2.5rem] border border-white/5 flex flex-col items-center justify-center shadow-inner">
                    <div className="flex gap-10 mt-[-10px]">
                        <motion.div
                            animate={{
                                scaleY: isTalking ? [1, 0.4, 1, 1, 1] : [1, 1, 0.4, 1, 1], // Periodic blinks
                                opacity: isTalking ? [0.9, 1, 0.9] : [0.6, 0.9, 0.6]
                            }}
                            transition={{ duration: isTalking ? 0.3 : 4, repeat: Infinity }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-pink-500 blur-xl opacity-40 scale-150" />
                            <div className="w-12 h-8 bg-pink-500 rounded-t-full shadow-[0_0_15px_#ec4899,0_0_30px_#ec4899] flex items-end justify-center overflow-hidden">
                                <div className="w-2/3 h-2/3 rounded-t-full bg-white/90  blur-[1px]" />
                            </div>
                        </motion.div>

                        <motion.div
                            animate={{
                                scaleY: isTalking ? [1, 0.4, 1, 1, 1] : [1, 1, 0.4, 1, 1],
                                opacity: isTalking ? [0.9, 1, 0.9] : [0.6, 0.9, 0.6]
                            }}
                            transition={{ duration: isTalking ? 0.3 : 4, repeat: Infinity, delay: 0.15 }}
                            className="relative"
                        >
                            <div className="absolute inset-0 bg-pink-500 blur-xl opacity-40 scale-150" />
                            <div className="w-12 h-8 bg-pink-500 rounded-t-full shadow-[0_0_15px_#ec4899,0_0_30px_#ec4899] flex items-end justify-center overflow-hidden">
                                <div className="w-2/3 h-2/3 rounded-t-full bg-white/90 blur-[1px]" />
                            </div>
                        </motion.div>
                    </div>

                    <div className="w-4 h-1.5 bg-pink-500/30 rounded-full mt-6 shadow-[0_0_10px_#ec4899]" />
                </div>

                <div className="absolute inset-0 bg-zinc-400/5 mix-blend-overlay pointer-events-none" />
            </div>

        </motion.div>
    );
};

const RobotStack = ({ isTalking }: { isTalking?: boolean }) => {
    return (
        <motion.div
            animate={{
                x: ['-30vw', '30vw', '-30vw'],
                y: ['-45vh', '25vh', '-45vh'],
                rotate: [-2, 2, -2]
            }}
            transition={{
                duration: 30,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none z-10"
        >
            <div className="flex flex-col items-center -space-y-20">
                <RobotHead delay={0.8} isTalking={isTalking} tilt={15} zIndex={3} xOffset={-60} />
                <RobotHead delay={0.4} isTalking={isTalking} tilt={0} zIndex={2} xOffset={80} />
                <RobotHead delay={0} isTalking={isTalking} tilt={-15} zIndex={1} xOffset={-50} />
            </div>

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1200px] h-[1200px] pointer-events-none">
                <div className="absolute top-1/4 -right-1/3 w-[600px] h-[600px] bg-pink-600/5 blur-[180px] rounded-full animate-pulse" />
                <div className="absolute -bottom-1/4 -left-1/3 w-[600px] h-[600px] bg-purple-600/5 blur-[180px] rounded-full animate-pulse" style={{ animationDelay: '1.5s' }} />
            </div>
        </motion.div>
    );
};

const FloatingTechLabel = ({ text, position, delay }: { text: string; position: { top?: string; left?: string; right?: string; bottom?: string }; delay: number }) => (
    <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
            opacity: [0.2, 0.4, 0.2],
            y: [0, -20, 0],
            x: [0, 10, 0]
        }}
        transition={{ duration: 8, repeat: Infinity, delay, ease: "easeInOut" }}
        className="absolute font-mono text-[10px] tracking-[0.2em] text-white/30 whitespace-nowrap hidden lg:block"
        style={position}
    >
        <div className="flex items-center gap-2">
            <div className="w-1 h-1 bg-pink-500 rounded-full animate-pulse" />
            {text}
        </div>
    </motion.div>
);

const ParticleField = () => {
    const particles = useMemo(() => {
        return [...Array(30)].map((_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 20 + 10,
            delay: Math.random() * 10
        }));
    }, []);

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-1">
            {particles.map((p) => (
                <motion.div
                    key={p.id}
                    initial={{ opacity: 0 }}
                    animate={{
                        opacity: [0, 0.5, 0],
                        y: ['0vh', '100vh'],
                        x: [`${p.x}vw`, `${p.x + (Math.random() * 10 - 5)}vw`]
                    }}
                    transition={{
                        duration: p.duration,
                        repeat: Infinity,
                        delay: p.delay,
                        ease: "linear"
                    }}
                    className="absolute w-1 h-1 bg-white rounded-full"
                    style={{ left: `${p.x}%`, top: '-5vh', width: p.size, height: p.size }}
                />
            ))}
        </div>
    );
};

const BackgroundDecorations = () => (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 opacity-[0.05] z-0" style={{
            backgroundImage: `linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
        }} />

        <motion.div
            animate={{
                scale: [1, 1.2, 1],
                x: [-20, 20, -20],
                y: [-20, 20, -20]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-[20%] -left-[10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full"
        />
        <motion.div
            animate={{
                scale: [1.2, 1, 1.2],
                x: [20, -20, 20],
                y: [20, -20, 20]
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -bottom-[20%] -right-[10%] w-[60%] h-[60%] bg-pink-600/10 blur-[150px] rounded-full"
        />

        <motion.div
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            className="absolute left-0 right-0 h-[100vh] bg-gradient-to-b from-transparent via-pink-500/[0.03] to-transparent z-1"
        />

        <FloatingTechLabel text="REAL-TIME PROCESSING" position={{ top: '25%', left: '8%' }} delay={0} />
        <FloatingTechLabel text="LATENCY: 240MS" position={{ top: '45%', right: '10%' }} delay={2} />
        <FloatingTechLabel text="NEURAL SYNCHRONIZATION" position={{ bottom: '35%', left: '12%' }} delay={4} />
        <FloatingTechLabel text="ENCRYPTED SESSION" position={{ bottom: '25%', right: '8%' }} delay={1} />

        <div className="absolute top-[15%] left-[5%] w-32 h-px bg-gradient-to-r from-white/20 to-transparent" />
        <div className="absolute top-[15%] left-[5%] w-px h-32 bg-gradient-to-b from-white/20 to-transparent" />
        <div className="absolute bottom-[15%] right-[5%] w-32 h-px bg-gradient-to-l from-white/20 to-transparent" />
        <div className="absolute bottom-[15%] right-[5%] w-px h-32 bg-gradient-to-t from-white/20 to-transparent" />

        <ParticleField />
    </div>
);


const VoiceInterface = ({ onDisconnect }: { onDisconnect: () => void }) => {
    const { localParticipant, isMicrophoneEnabled } = useLocalParticipant();
    const tracks = useTracks([Track.Source.Microphone]);
    const isMicEnabled = isMicrophoneEnabled;

    useEffect(() => {
        localParticipant?.setMicrophoneEnabled(true).catch(console.error);
    }, [localParticipant]);

    return (
        <div className="flex flex-col items-center gap-6">
            <div className="flex items-center gap-6">
                <Button
                    onClick={() => localParticipant?.setMicrophoneEnabled(!isMicEnabled)}
                    className={`rounded-full w-16 h-16 transition-all duration-300 hover:scale-110 ${isMicEnabled
                            ? "bg-white/10 text-white hover:bg-white/20 border border-white/10"
                            : "bg-red-500/20 text-red-500 hover:bg-red-500/30 border border-red-500/20"
                        }`}
                >
                    {isMicEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                </Button>

                <Button
                    onClick={onDisconnect}
                    variant="destructive"
                    className="rounded-full w-20 h-20 bg-red-500/80 hover:bg-red-500 shadow-lg shadow-red-500/20 transition-all duration-300 hover:scale-110"
                >
                    <PhoneOff className="w-8 h-8" />
                </Button>
            </div>
            <p className="text-white/60 text-sm font-mono animate-pulse uppercase tracking-widest">
                {isMicEnabled ? "Listening..." : "Microphone Muted"}
            </p>
        </div>
    );
};


export const VapiHero = () => {
    const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
    const [token, setToken] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string>("");

    useEffect(() => {
        const url = import.meta.env.VITE_LIVEKIT_URL || "wss://vokivo-agent-t4l0o6i0.livekit.cloud";
        setServerUrl(url);
    }, []);

    const handleStartTalk = async () => {
        setStatus('connecting');
        try {
            const roomName = `landing-demo-${Math.random().toString(36).substring(7)}`;
            const identity = `user-${Math.random().toString(36).substring(7)}`;

            const tokenPayload = await createLivekitToken({
                roomName,
                identity,
                dispatch: {
                    agentName: "ai",
                    metadata: {
                        source: "landing_demo",
                        assistantId: "694c438399e5550209b3b7e6"
                    },
                },
                ensureDispatch: true,
            });

            if (tokenPayload?.accessToken) {
                setToken(tokenPayload.accessToken);
                setStatus('connected');
            } else {
                throw new Error("Failed to get token");
            }
        } catch (error) {
            console.error("Connection failed:", error);
            setStatus('idle');
        }
    };

    const handleDisconnect = () => {
        setToken(null);
        setStatus('idle');
    };

    return (
        <section className="relative min-h-screen flex items-center justify-center bg-[#050505] overflow-hidden pt-20">
            <BackgroundDecorations />
            <RobotStack isTalking={status === 'connected'} />

            <div className="container relative z-20 flex flex-col items-center text-center px-6">
                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="flex flex-col items-center"
                        >
                            <div className="mb-6 py-1 px-4 rounded-full border border-white/10 bg-white/5 backdrop-blur-md">
                                <span className="text-[10px] font-mono tracking-[0.3em] text-pink-500 uppercase">Beta Access Now Live</span>
                            </div>

                            <h1 className="text-white text-5xl md:text-7xl lg:text-8xl font-bold mb-8 tracking-tighter leading-[0.9]">
                                THE NEW STANDARD FOR <br />
                                <span className="text-white/20">VOICE AI AGENTS</span>
                            </h1>

                            <motion.button
                                onClick={handleStartTalk}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="group relative mt-4"
                            >
                                <div className="absolute -inset-4 bg-pink-500/20 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition duration-500" />
                                <div className="relative px-14 py-7 bg-white rounded-full leading-none flex items-center shadow-[0_0_40px_rgba(255,255,255,0.1)] transition-all duration-300 group-hover:bg-pink-500">
                                    <span className="text-black group-hover:text-white font-mono text-xl md:text-2xl font-bold tracking-[0.2em]">TALK TO AI</span>
                                </div>
                            </motion.button>

                            <p className="mt-12 text-white/30 font-mono text-xs tracking-widest max-w-lg leading-relaxed uppercase">
                                Experience the future of human-AI interaction.<br />
                                Click above to start a live voice session.
                            </p>
                        </motion.div>
                    )}

                    {status === 'connecting' && (
                        <motion.div
                            key="connecting"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="flex flex-col items-center"
                        >
                            <div className="relative">
                                <div className="absolute inset-0 bg-blue-500/20 blur-3xl rounded-full animate-pulse" />
                                <Loader2 className="w-20 h-20 text-white animate-spin relative z-10" />
                            </div>
                            <h2 className="text-white text-2xl font-mono mt-8 tracking-widest">INITIALIZING...</h2>
                        </motion.div>
                    )}

                    {status === 'connected' && token && (
                        <motion.div
                            key="connected"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="flex flex-col items-center"
                        >
                            <LiveKitRoom
                                serverUrl={serverUrl}
                                token={token}
                                connect={true}
                                audio={true}
                                onDisconnected={handleDisconnect}
                            >
                                <RoomAudioRenderer />
                                <StartAudio label="Click to start listening" />
                                <div className="h-24" />
                                <VoiceInterface onDisconnect={handleDisconnect} />
                            </LiveKitRoom>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[#050505] to-transparent z-30" />
        </section>
    );
};
