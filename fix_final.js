const fs = require('fs');
let content = fs.readFileSync('src/services/supabaseService.ts', 'utf8');

// Fix PropertyInsert
content = content.replace(/floor_area\?: number;/g, 'floor_area?: number | null;');
content = content.replace(/location_lat\?: number;/g, 'location_lat?: number | null;');
content = content.replace(/location_lng\?: number;/g, 'location_lng?: number | null;');
content = content.replace(/description\?: string;/g, 'description?: string | null;');

// Fix createFullProperty signature
content = content.replace(
    'async createFullProperty(\r\n        propertyData: PropertyInsert,\r\n        imageFiles: File[],\r\n        userId: string\r\n    )',
    'async createFullProperty(\r\n        propertyData: PropertyInsert,\r\n        imageFiles: File[],\r\n        userId: string,\r\n        options?: CreateFullPropertyOptions\r\n    )'
);
content = content.replace(
    'async createFullProperty(\n        propertyData: PropertyInsert,\n        imageFiles: File[],\n        userId: string\n    )',
    'async createFullProperty(\n        propertyData: PropertyInsert,\n        imageFiles: File[],\n        userId: string,\n        options?: CreateFullPropertyOptions\n    )'
);

// Fix getFavorites signature
content = content.replace(
    /async getFavorites\(userId: string\): Promise<\{ data: PropertyRow\[\]; error: any \}>/g,
    'async getFavorites(userId: string, options?: RequestResilienceOptions): Promise<{ data: PropertyRow[]; error: any; isTimeout?: boolean }>'
);

fs.writeFileSync('src/services/supabaseService.ts', content, 'utf8');
console.log('Final fixes applied');
