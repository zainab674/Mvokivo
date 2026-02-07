
import React, { useMemo } from 'react';
import { useParticipants, BarVisualizer, useTracks } from '@livekit/components-react';
import { Participant, Track } from 'livekit-client';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
    className?: string;
    participantType?: 'agent' | 'local';
}

export function VoiceVisualizer({ className, participantType = 'agent' }: VoiceVisualizerProps) {
    const participants = useParticipants();
    const tracks = useTracks([Track.Source.Microphone], { onlySubscribed: false });

    const targetParticipant = useMemo(() => {
        if (participantType === 'local') {
            return participants.find((p) => p.isLocal);
        }

        const remoteParticipants = participants.filter(p => !p.isLocal);

        // If there's only one remote participant, it's likely the AI agent
        if (remoteParticipants.length === 1) {
            return remoteParticipants[0];
        }

        // Look for participants with audio tracks first, as that's likely the agent
        const participantsWithAudio = remoteParticipants.filter(p =>
            p.getTrackPublications().some(pub => pub.kind === Track.Kind.Audio)
        );

        if (participantsWithAudio.length === 1) {
            return participantsWithAudio[0];
        }

        // Otherwise, look for AI-related identifiers
        return remoteParticipants.find((p) =>
            p.identity.toLowerCase().includes('ai') ||
            p.name?.toLowerCase().includes('ai') ||
            p.identity.toLowerCase().includes('agent') ||
            p.identity.startsWith('agent-') ||
            p.identity.startsWith('guest-') ||
            p.identity.startsWith('user-') // Some demos use user- for both
        );
    }, [participants, participantType]);

    const audioTrack = useMemo(() => {
        if (!targetParticipant) return undefined;

        // Try to find the microphone/audio track for this participant
        const trackRef = tracks.find(t => t.participant.identity === targetParticipant.identity);
        if (trackRef) return trackRef;

        // Fallback: Check publications directly if useTracks hasn't picked it up yet
        const pub = targetParticipant.getTrackPublications().find(p => p.kind === Track.Kind.Audio);
        if (pub) {
            return {
                participant: targetParticipant,
                publication: pub,
                source: pub.source
            };
        }

        return undefined;
    }, [targetParticipant, tracks]);

    if (!targetParticipant || !audioTrack || !audioTrack.publication) {
        return (
            <div className={cn("flex flex-col items-center justify-center h-16 w-full max-w-md", className)}>
                <div className="flex gap-2 items-center">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s`, animationDuration: '1s' }}
                        />
                    ))}
                </div>
                <p className="text-[10px] text-muted-foreground mt-2 uppercase tracking-[0.2em] opacity-50 animate-pulse">
                    {participantType === 'agent' ? "Waiting for AI..." : "Waiting for Mic..."}
                </p>
            </div>
        );
    }

    return (
        <div className={cn("flex flex-col items-center justify-center w-full max-w-md h-16", className)}>
            <BarVisualizer
                trackRef={{
                    participant: targetParticipant as Participant,
                    source: audioTrack.source || Track.Source.Microphone,
                    publication: audioTrack.publication as any
                }}
                barCount={15}
                className="w-full h-full text-pink-500"
            />
        </div>
    );
}
