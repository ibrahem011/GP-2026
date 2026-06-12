'use client';
import { useState, useRef, useEffect } from 'react';
import { Message } from '@/types/messaging';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';

interface VoiceNoteBubbleProps {
    message?: Message; // Optional to support usage with just URL
    audioUrl?: string; // Support direct URL usage
    duration?: number;
    isMe: boolean;
    timestamp?: string; // Optional override
    isRead?: boolean;
}

export const VoiceNoteBubble = ({ message, audioUrl, duration: propDuration, isMe, timestamp, isRead }: VoiceNoteBubbleProps) => {
    const url = message?.media_url || audioUrl;
    const duration = message?.duration || propDuration || 0;
    const time = timestamp || (message ? formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: ar }) : '');
    const read = isRead !== undefined ? isRead : message?.is_read;

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause();
            } else {
                audioRef.current.play();
            }
            setIsPlaying(!isPlaying);
        }
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
        }
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setCurrentTime(0);
    };

    const formatTime = (time: number) => {
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
    };

    return (
        <div className={`flex w-full ${isMe ? 'justify-start' : 'justify-end'} mb-2`}>
            <div className={`
                flex items-center gap-3 px-4 py-3 rounded-2xl shadow-sm min-w-[200px]
                ${isMe
                    ? 'bg-primary text-white rounded-br-none'
                    : 'bg-white dark:bg-zinc-800 text-gray-800 dark:text-gray-200 rounded-bl-none border border-gray-100 dark:border-zinc-700'
                }
            `}>
                <button
                    onClick={togglePlay}
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-colors
                        ${isMe ? 'bg-white/20 hover:bg-white/30 text-white' : 'bg-primary/10 hover:bg-primary/20 text-primary'}
                    `}
                >
                    <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                        {isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                </button>

                <div className="flex-1 flex flex-col gap-1">
                    <div className="relative h-1 bg-current opacity-20 rounded-full w-full overflow-hidden">
                        <div
                            className="absolute top-0 right-0 h-full bg-current transition-all duration-100"
                            style={{ width: `${(currentTime / (duration || 30)) * 100}%` }}
                        />
                    </div>
                    <div className="flex justify-between items-center text-[10px] opacity-70">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                    </div>
                </div>

                <audio
                    ref={audioRef}
                    src={url}
                    onTimeUpdate={handleTimeUpdate}
                    onEnded={handleEnded}
                    className="hidden"
                />
            </div>

            {/* Timestamp outside bubble for consistency if needed, or keeping it clean */}
            {/* We can add it below if design requires */}
        </div>
    );
};
