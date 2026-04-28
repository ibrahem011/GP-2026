import AdminPropertiesClient from './client';

export const metadata = {
    title: 'إدارة العقارات | لوحة التحكم',
    description: 'مراجعة وإدارة العقارات المعروضة',
};

interface AdminPropertiesPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminPropertiesPage({ searchParams }: AdminPropertiesPageProps) {
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
    
    return <AdminPropertiesClient initialStatus={initialStatus} initialQ={initialQ} />;
}
