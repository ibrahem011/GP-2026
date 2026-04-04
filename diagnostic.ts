import { supabaseService } from './src/services/supabaseService';

async function run() {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://trrbabfexmjjqiwsdkji.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRycmJhYmZleG1qanFpd3Nka2ppIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk0NjQxNDUsImV4cCI6MjA4NTA0MDE0NX0.s0r9xkpBL7mAHlu5F4RGqkjLgCDhcsseE5ycnW15zDc';
    
    console.log('[DIAGNOSTIC] Testing getProperties()...');
    try {
        const props = await supabaseService.getProperties();
        console.log(`[DIAGNOSTIC] SUCCESS: Found ${props.length} properties.`);
    } catch (e: any) {
        console.error(`[DIAGNOSTIC] FAILED: ${e.message}`);
    }
    
    process.exit(0);
}

run();
