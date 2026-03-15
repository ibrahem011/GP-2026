import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('STORAGE_BUCKET dependency guard', () => {
    it('keeps storageBucket.ts dependency-free to avoid circular imports', () => {
        const modulePath = path.join(process.cwd(), 'src', 'lib', 'storageBucket.ts');
        const source = fs.readFileSync(modulePath, 'utf8');

        expect(source).not.toMatch(/^\s*import\s/m);
    });

    it('prevents supabase.ts from importing storage.ts', () => {
        const supabasePath = path.join(process.cwd(), 'src', 'lib', 'supabase.ts');
        const source = fs.readFileSync(supabasePath, 'utf8');

        expect(source).not.toMatch(/from ['"]\.\/storage['"]/);
        expect(source).not.toMatch(/from ['"]@\/lib\/storage['"]/);
    });
});
