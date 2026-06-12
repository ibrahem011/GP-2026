'use client';

interface MediaPermissionRequestProps {
    requesterName: string;
    onAction: (action: 'grant' | 'deny') => void;
}

export const MediaPermissionCard = ({ requesterName, onAction }: MediaPermissionRequestProps) => {
    return (
        <div className="flex justify-center w-full px-4">
            <div className="bg-white dark:bg-zinc-800 rounded-xl shadow-md border border-gray-100 dark:border-zinc-700 p-4 max-w-sm w-full">
                <div className="flex flex-col items-center text-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
                        <span aria-hidden="true" className="material-symbols-outlined text-primary text-2xl">lock_open</span>
                    </div>

                    <div>
                        <h4 className="font-bold text-gray-900 dark:text-white mb-1">طلب إذن وسائط</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            يطلب <strong>{requesterName}</strong> إذناً لإرسال صور ومقاطع فيديو. هل توافق؟
                        </p>
                    </div>

                    <div className="flex gap-3 w-full mt-2">
                        <button
                            onClick={() => onAction('deny')}
                            className="flex-1 py-2 px-4 rounded-lg border border-gray-200 dark:border-zinc-700 text-gray-600 dark:text-gray-300 text-sm font-medium hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                        >
                            رفض
                        </button>
                        <button
                            onClick={() => onAction('grant')}
                            className="flex-1 py-2 px-4 rounded-lg bg-primary text-white text-sm font-bold shadow-lg shadow-primary/20 hover:bg-primary/90 transition-colors"
                        >
                            موافقة
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
