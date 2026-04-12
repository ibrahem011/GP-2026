import AdminGuard from '@/components/auth/AdminGuard';
import { Metadata } from 'next';
import AdminSidebar from './AdminSidebar';
import AdminMobileNav from './AdminMobileNav';
import AdminHeader from './AdminHeader';
import { Providers } from '../providers';

export const metadata: Metadata = {
    title: 'لوحة الإدارة | عقارات جمصة',
    description: 'لوحة تحكم إدارة منصة عقارات جمصة',
};

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AdminGuard>
            {/* The main shell needs to cover the entire viewport and hide overflow on mobile optionally, but let's stick to standard flow */}
            <div className="min-h-screen bg-surface-dim dark:bg-background-dark font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300 flex">
                
                {/* Desktop Sidebar */}
                <AdminSidebar />

                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 lg:mr-64 transition-all duration-300">
                    
                    {/* Top Sticky Header */}
                    <AdminHeader />

                    {/* Page Content */}
                    <main className="flex-1 p-4 md:p-6 pb-28 lg:pb-8 max-w-7xl mx-auto w-full overflow-hidden">
                        <div className="animate-fade-in-up h-full">
                            {children}
                        </div>
                    </main>
                </div>

                {/* Mobile Bottom Navigation */}
                <AdminMobileNav />
            </div>
        </AdminGuard>
    );
}
