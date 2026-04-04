import { getPropertiesFromSupabase, getUserPropertiesFromSupabase } from './src/lib/storage.js';
import { supabaseService } from './src/services/supabaseService.js';

async function testFetch() {
    console.log('[+] Testing getPropertiesFromSupabase');
    try {
        const props = await getPropertiesFromSupabase();
        console.log(`- Retrieved ${props.length} properties via getPropertiesFromSupabase`);
    } catch(e) {
        console.log(`- Error:`, e);
    }
    
    console.log('\n[+] Testing supabaseService.getProperties()');
    try {
        const props2 = await supabaseService.getProperties();
        console.log(`- Retrieved ${props2.length} properties via supabaseService.getProperties`);
    } catch(e) {
        console.log(`- Error:`, e);
    }
}

testFetch();
