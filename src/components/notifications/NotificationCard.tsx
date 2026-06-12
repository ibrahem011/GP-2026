'use client';

import { Notification } from '@/lib/notifications';
import Link from 'next/link';

interface NotificationCardProps {
    notification: Notification;
    onClick: (notification: Notification) => void;
}

export default function NotificationCard({ notification, onClick }: NotificationCardProps) {
    const isUnread = notification.status === 'unread';

    // Type-based Icon & Color Logic
    const getIcon = () => {
        switch (notification.type) {
            case 'payment': return 'payments';
            case 'property': return 'home_work';
            case 'system': return 'info';
            default: return 'notifications';
        }
    };

    const getColorClass = () => {
        switch (notification.type) {
            case 'payment': return 'text-green-500 bg-green-50 dark:bg-green-900/20';
            case 'property': return 'text-blue-500 bg-blue-50 dark:bg-blue-900/20';
            case 'system': return 'text-gray-500 bg-gray-50 dark:bg-gray-800/50';
            default: return 'text-gray-500';
        }
    };

    // Component Content
    const Content = () => (
        <div className={`
            relative p-4 flex gap-4 items-start w-full text-right transition-all duration-300
            ${isUnread ? 'bg-white/90 dark:bg-gray-800/90 shadow-sm border-blue-100 dark:border-blue-900/30' : 'bg-white/60 dark:bg-gray-900/40 opacity-70 hover:opacity-100'}
            rounded-2xl border backdrop-blur-xl
            border-white/20
            ${isUnread ? 'border-l-4 border-l-blue-500' : ''} 
            active:scale-[0.99]
        `}>
            {/* Icon Column */}
            <div className={`
                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                ${getColorClass()}
            `}>
                <span aria-hidden="true" className="material-symbols-outlined text-[20px]">
                    {getIcon()}
                </span>
            </div>

            {/* Text Column */}
            <div className="flex-1 space-y-1">
                <div className="flex justify-between items-start">
                    <p className={`text-xs text-gray-400 font-medium font-english`}>
                        {new Date(notification.createdAt).toLocaleDateString('ar-EG', {
                            day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
                        })}
                    </p>
                    <h3 className={`text-sm ${isUnread ? 'font-bold text-gray-900 dark:text-gray-100' : 'font-medium text-gray-700 dark:text-gray-300'}`}>
                        {notification.title}
                    </h3>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {notification.message}
                </p>

                {/* Unread Indicator Dot (Mobile friendly visual cue) */}
                {isUnread && (
                    <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                )}
            </div>
        </div>
    );

    // Wrapper Logic (Button vs Link)
    const handleClick = () => onClick(notification);

    if (notification.link) {
        return (
            <Link
                href={notification.link}
                onClick={handleClick}
                className="block w-full focus:outline-none"
            >
                <Content />
            </Link>
        );
    }

    return (
        <button
            onClick={handleClick}
            className="block w-full text-right focus:outline-none"
        >
            <Content />
        </button>
    );
}
