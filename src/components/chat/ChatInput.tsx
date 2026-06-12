'use client';

import { useState, useRef, useEffect } from 'react';
import { supabaseService } from '@/services/supabaseService';
import { validateFile, validateMessage } from '@/utils/validation';

interface ChatInputProps {
    conversationId: string;
    currentUserId: string;
    hasMediaPermission: boolean;
    onSendMessage: (text: string) => void;
    onRequestPermission: () => void;
}

const QUICK_ACTIONS = [
    { label: 'هل العقار متاح؟', icon: 'event_available' },
    { label: 'كم آخر سعر؟', icon: 'payments' },
    { label: 'ممكن صور زيادة؟', icon: 'add_photo_alternate' },
    { label: 'الموقع فين؟', icon: 'location_on' },
];

export const ChatInput = ({
    conversationId,
    currentUserId,
    hasMediaPermission,
    onSendMessage,
    onRequestPermission
}: ChatInputProps) => {
    const [message, setMessage] = useState('');
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    // Recording Logic
    const startRecording = async () => {
        if (!hasMediaPermission) {
            onRequestPermission();
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                await sendVoiceMessage(audioBlob);

                // Stop all tracks
                stream.getTracks().forEach(track => track.stop());
            };

            mediaRecorder.start();
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = setInterval(() => {
                setRecordingTime(prev => prev + 1);
            }, 1000);

        } catch (error) {
            console.error('Error starting recording:', error);
            alert('فشل الوصول إلى الميكروفون');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const cancelRecording = () => {
        if (mediaRecorderRef.current && isRecording) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            audioChunksRef.current = [];
            if (timerRef.current) clearInterval(timerRef.current);
        }
    };

    const sendVoiceMessage = async (audioBlob: Blob) => {
        // Validation handled by simulating a File/Blob check if needed, but here simple blob check is enough
        if (audioBlob.size > 10 * 1024 * 1024) {
            alert('حجم التسجيل كبير جداً');
            return;
        }

        try {
            setUploading(true);
            // In a real scenario, we might cast Blob to File to satisfy the type, or update uploadMedia signature
            // For now, casting as any or File
            const audioFile = new File([audioBlob], `voice_${Date.now()}.webm`, { type: 'audio/webm' });

            const url = await supabaseService.uploadMedia(audioFile, 'voice', conversationId);
            await supabaseService.sendMessage({
                conversationId,
                senderId: currentUserId,
                messageType: 'voice',
                mediaUrl: url,
                duration: recordingTime
            });
        } catch (error) {
            console.error('Failed to send voice note:', error);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!message.trim()) return;

        const validation = validateMessage(message);
        if (!validation.isValid) {
            alert(validation.error);
            return;
        }

        onSendMessage(message);
        setMessage('');
    };

    const handleQuickAction = (text: string) => {
        onSendMessage(text);
    };

    const handleAttachmentClick = () => {
        if (!hasMediaPermission) {
            onRequestPermission();
            return;
        }
        fileInputRef.current?.click();
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const validation = validateFile(file, 'image');
        if (!validation.isValid) {
            alert(validation.error);
            if (fileInputRef.current) fileInputRef.current.value = '';
            return;
        }

        try {
            setUploading(true);
            const url = await supabaseService.uploadMedia(file, 'image', conversationId);
            await supabaseService.sendMessage({
                conversationId,
                senderId: currentUserId,
                messageType: 'image',
                mediaUrl: url
            });
        } catch (error) {
            console.error('Upload failed:', error);
            alert('فشل رفع الملف');
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    return (
        <div className="bg-white dark:bg-zinc-800 p-2 sm:p-4 border-t border-gray-100 dark:border-zinc-700">
            {/* Quick Actions */}
            {!isRecording && (
                <div className="flex gap-2 overflow-x-auto pb-3 mb-2 no-scrollbar mask-gradient-x">
                    {QUICK_ACTIONS.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleQuickAction(action.label)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-zinc-700/50 hover:bg-white dark:hover:bg-zinc-700 border border-gray-200 dark:border-zinc-600 rounded-full text-xs text-gray-600 dark:text-gray-300 transition-all whitespace-nowrap active:scale-95"
                        >
                            <span aria-hidden="true" className="material-symbols-outlined text-[16px]">{action.icon}</span>
                            {action.label}
                        </button>
                    ))}
                </div>
            )}

            <form onSubmit={handleSubmit} className="flex items-end gap-2 relative">
                {isRecording ? (
                    <div className="flex-1 bg-red-50 dark:bg-red-900/20 rounded-2xl p-2 flex items-center justify-between animate-pulse border border-red-100 dark:border-red-900/30">
                        <div className="flex items-center gap-3 px-2">
                            <div className="w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
                            <span className="text-red-500 font-mono font-bold">{formatTime(recordingTime)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={cancelRecording}
                                className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined">delete</span>
                            </button>
                            <button
                                type="button"
                                onClick={stopRecording}
                                className="w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg hover:bg-red-600 transition-colors"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined">send</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <>
                        <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />

                        <button
                            type="button"
                            onClick={handleAttachmentClick}
                            disabled={uploading}
                            className={`w-10 h-10 rounded-full flex items-center justify-center bg-gray-100 dark:bg-zinc-700 text-gray-500 hover:text-primary transition-colors hover:bg-primary/10 ${uploading ? 'opacity-50' : ''}`}
                        >
                            <span aria-hidden="true" className="material-symbols-outlined">
                                {uploading ? 'cloud_upload' : (hasMediaPermission ? 'add_photo_alternate' : 'lock')}
                            </span>
                        </button>

                        <div className="flex-1 bg-gray-100 dark:bg-zinc-700 rounded-2xl p-2 flex items-center gap-2">
                            <button
                                type="button"
                                className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-yellow-500 transition-colors"
                            >
                                <span aria-hidden="true" className="material-symbols-outlined">sentiment_satisfied</span>
                            </button>

                            <textarea
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !e.shiftKey) {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                                placeholder="اكتب رسالتك هنا..."
                                rows={1}
                                className="flex-1 bg-transparent border-none focus:outline-none resize-none max-h-32 py-1.5 text-gray-900 dark:text-white placeholder-gray-400 text-sm"
                                style={{ minHeight: '44px' }}
                            />
                        </div>

                        <div className="flex gap-1">
                            {message.trim() ? (
                                <button
                                    type="submit"
                                    className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all"
                                >
                                    <span aria-hidden="true" className="material-symbols-outlined scale-x-[-1]">send</span>
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onMouseDown={startRecording}
                                    onTouchStart={startRecording}
                                    className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary hover:text-white transition-all"
                                >
                                    <span aria-hidden="true" className="material-symbols-outlined">mic</span>
                                </button>
                            )}
                        </div>
                    </>
                )}
            </form>
        </div>
    );
};
