
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import {
    LiveKitRoom,
    RoomAudioRenderer,
    StartAudio,
    TrackToggle,
    useLocalParticipant,
    useRoomContext,
} from "@livekit/components-react";
import { Track } from "livekit-client";
import "@livekit/components-styles";
import { Button } from "@/components/ui/button";
import { createLivekitToken } from "@/lib/api/apiService";
import { BACKEND_URL } from "@/lib/api-config";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, PhoneOff, Loader2 } from "lucide-react";

export default function PublicAgent() {
    const { assistantId } = useParams<{ assistantId: string }>();
    const [token, setToken] = useState<string | null>(null);
    const [serverUrl, setServerUrl] = useState<string>("");
    const [connecting, setConnecting] = useState(false);
    const [assistant, setAssistant] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const url =
            (import.meta.env.VITE_LIVEKIT_URL ||
                "wss://vokivo-agent-t4l0o6i0.livekit.cloud") as string;
        setServerUrl(url);
    }, []);

    useEffect(() => {
        if (assistant?.name) {
            document.title = `${assistant.name} | Vokivo AI`;
        } else {
            document.title = "AI Voice Assistant | Vokivo";
        }
    }, [assistant]);

    useEffect(() => {
        const loadAssistant = async () => {
            if (!assistantId) return;
            try {
                const response = await fetch(`${BACKEND_URL}/api/v1/assistants/public/${assistantId}`);
                if (!response.ok) throw new Error("Assistant not found");
                const { data } = await response.json();
                setAssistant(data);
            } catch (err) {
                console.error("Failed to load assistant:", err);
                setError("Could not load assistant configuration.");
            }
        };
        loadAssistant();
    }, [assistantId]);

    const handleConnect = async () => {
        setConnecting(true);
        setError(null);
        try {
            const roomName = `web-${assistantId}-${Math.random().toString(36).substring(7)}`;
            const identity = `guest-${Math.random().toString(36).substring(7)}`;

            const tokenPayload = await createLivekitToken({
                roomName,
                identity,
                dispatch: {
                    agentName: "ai",
                    metadata: {
                        assistantId,
                        source: "embed",
                        isPublic: true
                    },
                },
                ensureDispatch: true,
            });

            if (tokenPayload?.accessToken) {
                setToken(tokenPayload.accessToken);
            } else {
                throw new Error("Failed to get access token");
            }
        } catch (e) {
            console.error(e);
            setError("Failed to connect to the agent.");
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = () => {
        setToken(null);
    };

    if (error) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#050505] text-white p-4">
                <div className="text-center">
                    <p className="text-red-400 mb-4">{error}</p>
                    <Button variant="outline" onClick={() => window.location.reload()}>Retry</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-screen flex-col items-center justify-center bg-[#050505] text-white overflow-hidden">
            <AnimatePresence mode="wait">
                {!token ? (
                    <motion.div
                        key="idle"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.1 }}
                        className="flex flex-col items-center text-center p-6 max-w-sm"
                    >
                        <div className="w-24 h-24 mb-6 rounded-full bg-indigo-600/20 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_30px_rgba(79,70,229,0.2)]">
                            <Mic className="w-10 h-10 text-indigo-400" />
                        </div>
                        <h1 className="text-2xl font-semibold mb-2">{assistant?.name || "AI Voice Assistant"}</h1>
                        <p className="text-zinc-500 text-sm mb-8">
                            Click the button below to start a conversation with our AI agent.
                        </p>
                        <Button
                            size="lg"
                            onClick={handleConnect}
                            disabled={connecting || !assistant}
                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-full h-14 text-lg font-medium shadow-lg shadow-indigo-600/20"
                        >
                            {connecting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Connecting...
                                </>
                            ) : (
                                "Start Conversation"
                            )}
                        </Button>
                    </motion.div>
                ) : (
                    <motion.div
                        key="active"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="w-full h-full flex flex-col items-center justify-center p-6"
                    >
                        <LiveKitRoom
                            serverUrl={serverUrl}
                            token={token}
                            connect={true}
                            audio={true}
                            onDisconnected={handleDisconnect}
                        >
                            <RoomAudioRenderer />
                            <StartAudio label="Enable audio to chat" />

                            {/* Visualizer Placeholder / Pulsing Circle */}
                            <div className="relative mb-12">
                                <motion.div
                                    animate={{
                                        scale: [1, 1.2, 1],
                                        opacity: [0.3, 0.6, 0.3],
                                    }}
                                    transition={{
                                        duration: 2,
                                        repeat: Infinity,
                                        ease: "easeInOut",
                                    }}
                                    className="absolute inset-0 bg-indigo-500 rounded-full blur-3xl"
                                />
                                <div className="relative w-32 h-32 rounded-full bg-[#111] border-2 border-indigo-500/50 flex items-center justify-center z-10">
                                    <div className="w-16 h-1 bg-indigo-500/50 rounded-full animate-pulse" />
                                </div>
                            </div>

                            <div className="text-center mb-12">
                                <h2 className="text-lg font-medium text-indigo-400 mb-1">Live Conversation</h2>
                                <p className="text-sm text-zinc-500">The agent is listening...</p>
                            </div>

                            <MicControl />
                        </LiveKitRoom>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="absolute bottom-6 opacity-30 text-[10px] tracking-widest uppercase font-mono">
                Powered by Vokivo AI
            </div>
        </div>
    );
}

function MicControl() {
    const { localParticipant } = useLocalParticipant();
    const [isMuted, setIsMuted] = useState(!localParticipant.isMicrophoneEnabled);

    useEffect(() => {
        const handleUpdate = () => {
            setIsMuted(!localParticipant.isMicrophoneEnabled);
        };
        localParticipant.on("trackMuted", handleUpdate);
        localParticipant.on("trackUnmuted", handleUpdate);
        localParticipant.on("localTrackPublished", handleUpdate);
        localParticipant.on("localTrackUnpublished", handleUpdate);
        return () => {
            localParticipant.off("trackMuted", handleUpdate);
            localParticipant.off("trackUnmuted", handleUpdate);
            localParticipant.off("localTrackPublished", handleUpdate);
            localParticipant.off("localTrackUnpublished", handleUpdate);
        };
    }, [localParticipant]);

    const toggleMic = async () => {
        const enabled = localParticipant.isMicrophoneEnabled;
        await localParticipant.setMicrophoneEnabled(!enabled);
        setIsMuted(enabled); // State updates to the opposite of current enabled state
    };

    return (
        <div className="flex items-center gap-4">
            <Button
                variant="outline"
                size="icon"
                onClick={toggleMic}
                className={`rounded-full w-14 h-14 transition-all duration-300 ${isMuted ? 'border-red-500/50 text-red-500 bg-red-500/10' : 'border-zinc-700 bg-transparent'}`}
            >
                {!isMuted ? (
                    <Mic className="w-6 h-6" />
                ) : (
                    <MicOff className="w-6 h-6" />
                )}
            </Button>
            <DisconnectButton />
        </div>
    );
}

function DisconnectButton() {
    const { disconnect } = useRoomContext();
    return (
        <Button
            variant="destructive"
            size="icon"
            onClick={() => disconnect()}
            className="rounded-full w-16 h-16 bg-red-600 hover:bg-red-700 shadow-lg shadow-red-600/20"
        >
            <PhoneOff className="w-8 h-8 text-white" />
        </Button>
    );
}
