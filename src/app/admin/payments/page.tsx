import AdminPaymentsClient from './client';

export const metadata = {
    title: 'إدارة المدفوعات | لوحة التحكم',
    description: 'مراجعة وتأكيد طلبات الدفع',
};

interface AdminPaymentsPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPaymentsPage({ searchParams }: AdminPaymentsPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    
    // Fallback properly: status defaults to 'pending', q to ''
    const statusVal = Array.isArray(resolvedSearchParams.status) 
        ? resolvedSearchParams.status[0] 
        : resolvedSearchParams.status;
    const initialStatus = statusVal || 'pending';

    const qVal = Array.isArray(resolvedSearchParams.q) 
        ? resolvedSearchParams.q[0] 
        : resolvedSearchParams.q;
    const initialQ = qVal || '';
    
    return <AdminPaymentsClient initialStatus={initialStatus} initialQ={initialQ} />;
}
