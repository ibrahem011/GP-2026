import BookingDetailsClient from './client';

interface BookingDetailsPageProps {
    params: Promise<{ id: string }>;
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function BookingDetailsPage({ params, searchParams }: BookingDetailsPageProps) {
    const { id } = await params;
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const isCreatedFlow = resolvedSearchParams.created === '1';

    return <BookingDetailsClient bookingId={id} isCreatedFlow={isCreatedFlow} />;
}
