import BookingDetailsClient from './client';

interface BookingDetailsPageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingDetailsPage({ params, searchParams }: BookingDetailsPageProps) {
    const { id } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const isCreatedFlow = resolvedSearchParams.created === '1';
    
    let entryView: 'tenant' | 'landlord' | undefined;
    if (resolvedSearchParams.view === 'tenant') entryView = 'tenant';
    if (resolvedSearchParams.view === 'landlord') entryView = 'landlord';

    return <BookingDetailsClient bookingId={id} isCreatedFlow={isCreatedFlow} entryView={entryView} />;
}
