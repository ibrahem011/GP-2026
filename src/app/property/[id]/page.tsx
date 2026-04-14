import { Metadata } from 'next';
import { fromPropertyRow } from '@/lib/propertyMapper';
import { supabaseService } from '@/services/supabaseService';
import ClientPropertyDetails from './client';
import { notFound } from 'next/navigation';
import { Property, CATEGORY_AR } from '@/types';

async function getProperty(id: string): Promise<Property | null> {
    const propertyRow = await supabaseService.getPropertyById(id);

    if (!propertyRow) return null;

    return fromPropertyRow(propertyRow);
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
    const { id } = await params;
    const property = await getProperty(id);

    if (!property) {
        return {
            title: 'ط¹ظ‚ط§ط± ط؛ظٹط± ظ…ظˆط¬ظˆط¯',
        };
    }

    const title = `${property.title} - ${property.price} ط¬.ظ… | ط¹ظ‚ط§ط±ط§طھ ط¬ظ…طµط©`;
    const description = `${CATEGORY_AR[property.category]} ظ„ظ„ط¥ظٹط¬ط§ط± ظپظٹ ${property.location.address}. ${property.bedrooms} ط؛ط±ظپطŒ ${property.bathrooms} ط­ظ…ط§ظ…. ${property.description.substring(0, 100)}...`;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            images: property.images.length > 0 ? [property.images[0]] : [],
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            images: property.images.length > 0 ? [property.images[0]] : [],
        },
    };
}

export default async function PropertyPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;

    await supabaseService.incrementPropertyViews(id);

    const property = await getProperty(id);

    if (!property) {
        notFound();
    }

    return <ClientPropertyDetails key={property.id} initialProperty={property} />;
}
