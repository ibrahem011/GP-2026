import { createClient } from '@supabase/supabase-js';
import { STORAGE_BUCKET } from './storageBucket';
import { buildStorageObjectPath, extractStoragePath } from './storagePaths';

// التحقق من وجود المتغيرات (Fail-Fast Guard)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey ||
    supabaseUrl.includes('placeholder') ||
    supabaseAnonKey === 'placeholder') {
    throw new Error(
        '❌ Invalid Supabase configuration.\n' +
        'Please add valid credentials to .env.local:\n' +
        '  NEXT_PUBLIC_SUPABASE_URL=your_supabase_url\n' +
        '  NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key\n' +
        '\nRestart the server after updating the file.'
    );
}

// إنشاء العميل
export const supabase = createClient(
    supabaseUrl,
    supabaseAnonKey,
    {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true,
        },
        global: process.env.VITEST_SUPABASE_MOCK === '1' ? {
            fetch: (...args) => fetch(...args),
        } : undefined
    }
);

// Re-exported for backward compatibility with existing imports.
export { STORAGE_BUCKET };

// دوال مساعدة للتخزين
export async function uploadImage(file: File, pathPrefix: string = ''): Promise<string> {
    const fileExt = file.name.split('.').pop();
    const fileName = buildStorageObjectPath(
        pathPrefix,
        `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`,
    );

    const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(fileName, file, {
            cacheControl: '3600',
            upsert: false,
        });

    if (uploadError) {
        throw new Error(`فشل رفع الصورة: ${uploadError.message}`);
    }

    return fileName;
}

export async function deleteImage(pathOrUrl: string): Promise<void> {
    const fileName = extractStoragePath(pathOrUrl, STORAGE_BUCKET) || pathOrUrl.trim();
    if (!fileName) return;

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .remove([fileName]);

    if (error) {
        console.error('Error deleting image:', error);
    }
}
