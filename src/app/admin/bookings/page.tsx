import AdminBookingsClient from './client';

export const metadata = {
    title: 'إدارة الحجوزات',
};

interface AdminBookingsPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminBookingsPage({ searchParams }: AdminBookingsPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const q = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] : resolvedSearchParams.q;
    
    return <AdminBookingsClient initialQ={q} />;
}
