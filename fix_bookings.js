const fs = require('fs');
let content = fs.readFileSync('src/services/supabaseService.ts', 'utf8');

const regexMap = [
    {
        target: /async getUserBookings\(userId: string\): Promise<\{ bookings: any\[\]; error: any \}>/g,
        replacement: 'async getUserBookings(userId: string, options?: RequestResilienceOptions): Promise<{ bookings: any[]; error: any; isTimeout?: boolean }>'
    },
    {
        target: /async getPropertyBookings\(propertyId: string\): Promise<\{ bookings: any\[\]; error: any \}>/g,
        replacement: 'async getPropertyBookings(propertyId: string, options?: RequestResilienceOptions): Promise<{ bookings: any[]; error: any; isTimeout?: boolean }>'
    },
    {
        target: /async function getUserBookingsFallback\(userId: string\): Promise<\{ bookings: any\[\]; error: any \}>/g,
        replacement: 'async function getUserBookingsFallback(userId: string): Promise<{ bookings: any[]; error: any; isTimeout?: boolean }>'
    },
    {
        target: /async getUserBookingsLegacy\(userId: string\): Promise<\{\s*data: import\('@\/types'\)\.Booking\[\];\s*error: any;\s*\}>/g,
        replacement: 'async getUserBookingsLegacy(userId: string, options?: RequestResilienceOptions): Promise<{ data: import(\'@/types\').Booking[]; error: any; isTimeout?: boolean }>'
    }
];

regexMap.forEach(({ target, replacement }) => {
    content = content.replace(target, replacement);
});

fs.writeFileSync('src/services/supabaseService.ts', content, 'utf8');
console.log('Bookings fixed');
