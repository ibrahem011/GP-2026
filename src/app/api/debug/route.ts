import { NextResponse } from 'next/server';
import { supabaseService } from '@/services/supabaseService';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    try {
        const result: any = {};
        
        // Use supabaseService which now handles both Mock and Production modes correctly
        try {
            const props = await supabaseService.getProperties();
            result.serviceGetAll = { count: props.length, firstProp: props[0] };
        } catch(e: any) {
            result.serviceGetAll = { error: e.message };
        }

        if (userId) {
            try {
                const props = await supabaseService.getProperties({ ownerId: userId });
                result.serviceGetUser = { count: props.length, firstProp: props[0] };
            } catch(e: any) {
                result.serviceGetUser = { error: e.message };
            }
        }

        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
