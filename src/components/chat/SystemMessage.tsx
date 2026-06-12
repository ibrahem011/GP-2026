'use client';

import { MediaPermissionCard } from './MediaPermissionCard';

interface SystemMessageProps {
    type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?: any;
    onAction?: (action: string) => void;
}

export const SystemMessage = ({ type, data, onAction }: SystemMessageProps) => {
    if (type === 'media_permission_request') {
        return (
            <div className="my-4">
                <MediaPermissionCard
                    requesterName={data?.requester_name || 'المستخدم'}
                    onAction={(action) => onAction && onAction(action)}
                />
            </div>
        );
    }

    if (type === 'safety_warning') {
        return (
            <div className="flex justify-center my-4 px-4">
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-lg p-3 max-w-sm text-center">
                    <p className="text-yellow-800 dark:text-yellow-200 text-sm flex items-center justify-center gap-2">
                        <span aria-hidden="true" className="material-symbols-outlined text-lg">warning</span>
                        {data?.text || 'يرجى إتمام جميع التعاملات المالية داخل التطبيق لضمان حقك.'}
                    </p>
                </div>
            </div>
        );
    }

    if (type === 'booking_request') {
        return (
            <div className="flex justify-center my-4 px-4">
                <div className="max-w-sm rounded-lg border border-blue-200 bg-blue-50 p-3 text-center dark:border-blue-900/50 dark:bg-blue-950/20">
                    <p className="flex items-center justify-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                        <span aria-hidden="true" className="material-symbols-outlined text-lg">event_note</span>
                        {data?.text || 'تم إرسال طلب حجز جديد.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex justify-center my-2 text-xs text-gray-400">
            <span>{data?.text || 'إشعار نظام'}</span>
        </div>
    );
};
