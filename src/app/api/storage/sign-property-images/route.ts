import { NextResponse } from 'next/server';
import { getServiceRoleSupabaseClient, signPathsWithServiceRole } from '@/lib/serverSupabase';
import { STORAGE_BUCKETS, extractStoragePath } from '@/lib/storagePaths';

export const dynamic = 'force-dynamic';

const MAX_PATHS_PER_REQUEST = 50;
const SIGNED_URL_TTL_SECONDS = 60 * 5;

export async function POST(request: Request) {
    const client = getServiceRoleSupabaseClient();

    if (!client) {
        return NextResponse.json(
            { error: 'SUPABASE_SERVICE_ROLE_KEY is required to sign private property images.' },
            { status: 500 },
        );
    }

    try {
        const body: { paths?: unknown } = await request.json().catch(() => ({}));
        const rawPaths: string[] = Array.isArray(body.paths)
            ? body.paths.filter((value): value is string => typeof value === 'string')
            : [];

        const normalizedPaths = Array.from(
            new Set(
                rawPaths
                    .map((value) => extractStoragePath(value, STORAGE_BUCKETS.propertiesImages) || '')
                    .map((value) => value.trim())
                    .filter(Boolean),
            ),
        ).slice(0, MAX_PATHS_PER_REQUEST);

        if (normalizedPaths.length === 0) {
            return NextResponse.json({ urls: {} });
        }

        const allowedPaths = new Set<string>();

        await Promise.all(
            normalizedPaths.map(async (path) => {
                const { data, error } = await client
                    .from('properties')
                    .select('id')
                    .contains('images', [path])
                    .in('status', ['available', 'rented'])
                    .limit(1);

                if (!error && data && data.length > 0) {
                    allowedPaths.add(path);
                }
            }),
        );

        const signedUrls = await signPathsWithServiceRole(
            STORAGE_BUCKETS.propertiesImages,
            Array.from(allowedPaths),
            SIGNED_URL_TTL_SECONDS,
        );

        return NextResponse.json({
            urls: Object.fromEntries(signedUrls.entries()),
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error?.message || 'Failed to sign property images.' },
            { status: 500 },
        );
    }
}
