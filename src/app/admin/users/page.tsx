import AdminUsersClient from './client';

export const metadata = {
    title: 'إدارة المستخدمين',
};

interface AdminUsersPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function AdminUsersPage({ searchParams }: AdminUsersPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const q = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] : resolvedSearchParams.q;
    
    return <AdminUsersClient initialQ={q} />;
}
