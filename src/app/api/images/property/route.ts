import { NextResponse } from 'next/server';

const FALLBACK_IMAGE_PATH = '/images/property-placeholder.svg';
const IMAGE_TIMEOUT_MS = 8_000;
const MAX_RETRIES = 1;
const PROPERTY_SIGNED_PATH_SEGMENT = '/storage/v1/object/sign/properties-images/';

function timeoutError(): Error & { code: string } {
    const error = new Error('REQUEST_TIMEOUT') as Error & { code: string };
    error.name = 'TimeoutError';
    error.code = 'REQUEST_TIMEOUT';
    return error;
}

function createFallbackRedirect(requestUrl: string) {
    const response = NextResponse.redirect(new URL(FALLBACK_IMAGE_PATH, requestUrl));
    response.headers.set('Cache-Control', 'no-store, max-age=0');
    return response;
}

function isAllowedPropertyImageUrl(rawUrl: string): boolean {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
        return false;
    }

    try {
        const sourceUrl = new URL(rawUrl);
        const allowedUrl = new URL(supabaseUrl);

        if (sourceUrl.protocol !== 'https:') {
            return false;
        }

        if (sourceUrl.hostname !== allowedUrl.hostname) {
            return false;
        }

        return sourceUrl.pathname.includes(PROPERTY_SIGNED_PATH_SEGMENT);
    } catch {
        return false;
    }
}

async function fetchWithTimeoutAndRetry(url: string, retriesLeft = MAX_RETRIES): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(timeoutError()), IMAGE_TIMEOUT_MS);

    try {
        const response = await fetch(url, {
            signal: controller.signal,
            redirect: 'follow',
        });

        if (!response.ok) {
            throw new Error(`UPSTREAM_IMAGE_HTTP_${response.status}`);
        }

        return response;
    } catch (error) {
        if (retriesLeft > 0) {
            return fetchWithTimeoutAndRetry(url, retriesLeft - 1);
        }

        throw error;
    } finally {
        clearTimeout(timeoutId);
    }
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const source = searchParams.get('src')?.trim() || '';

    if (!source || !isAllowedPropertyImageUrl(source)) {
        return createFallbackRedirect(request.url);
    }

    try {
        const upstream = await fetchWithTimeoutAndRetry(source);
        const buffer = await upstream.arrayBuffer();
        const response = new NextResponse(buffer, {
            status: 200,
            headers: {
                'Content-Type': upstream.headers.get('Content-Type') || 'image/jpeg',
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });

        return response;
    } catch (error) {
        console.error('[PropertyImageProxy] Failed to load image:', error);
        return createFallbackRedirect(request.url);
    }
}
