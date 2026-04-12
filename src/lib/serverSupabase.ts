import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { StorageBucketName } from './storagePaths';
import { Database } from '@/types/database.types';

let serviceRoleClient: SupabaseClient<Database> | null = null;

export function getServiceRoleSupabaseClient(): SupabaseClient<Database> | null {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceRoleKey) {
        return null;
    }

    if (!serviceRoleClient) {
        serviceRoleClient = createClient<Database>(url, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });
    }

    return serviceRoleClient;
}

export async function signPathsWithServiceRole(
    bucket: StorageBucketName,
    paths: string[],
    expiresIn: number,
) {
    const client = getServiceRoleSupabaseClient();

    if (!client) {
        return new Map<string, string>();
    }

    const uniquePaths = Array.from(new Set(paths.filter(Boolean)));
    if (uniquePaths.length === 0) {
        return new Map<string, string>();
    }

    const bucketClient = client.storage.from(bucket);
    const signedUrlMap = new Map<string, string>();

    if (typeof bucketClient.createSignedUrls === 'function') {
        const { data, error } = await bucketClient.createSignedUrls(uniquePaths, expiresIn);
        if (error) {
            throw error;
        }

        for (const item of data || []) {
            if (item.path && item.signedUrl) {
                signedUrlMap.set(item.path, item.signedUrl);
            }
        }

        return signedUrlMap;
    }

    for (const path of uniquePaths) {
        const { data, error } = await bucketClient.createSignedUrl(path, expiresIn);
        if (!error && data?.signedUrl) {
            signedUrlMap.set(path, data.signedUrl);
        }
    }

    return signedUrlMap;
}

