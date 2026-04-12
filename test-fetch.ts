import { supabaseService } from './src/services/supabaseService.js';

async function testFetch() {
    console.log('\n[+] Testing supabaseService.getProperties()');
    try {
        const properties = await supabaseService.getProperties();
        console.log(`- Retrieved ${properties.length} properties via supabaseService.getProperties`);
    } catch(e) {
        console.log(`- Error:`, e);
    }
}

testFetch();
