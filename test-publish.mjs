import { supabaseService } from './src/services/supabaseService.js';
import { supabase } from './src/lib/supabase.js';

async function testPublish() {
    try {
        console.log('Testing connection...');
        const { data, error } = await supabase.from('properties').select('id').limit(1);
        if (error) {
            console.error('Supabase query error:', error);
        } else {
            console.log('Connection OK, properties count (max 1):', data.length);
        }
    } catch (err) {
        console.error('Test failed:', err);
    }
}

testPublish();
