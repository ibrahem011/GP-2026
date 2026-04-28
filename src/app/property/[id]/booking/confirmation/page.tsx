import { redirect } from 'next/navigation';

interface ConfirmationPageProps {
    searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function ConfirmationPage({ searchParams }: ConfirmationPageProps) {
    const resolvedSearchParams = searchParams ? await searchParams : {};
    const bookingId = resolvedSearchParams.bookingId;

    if (typeof bookingId === 'string' && bookingId) {
        redirect(`/bookings/${bookingId}?created=1`);
    }

    redirect('/bookings');
}
