const fs = require('fs');
let content = fs.readFileSync('src/services/supabaseService.ts', 'utf8');

content = content.replace('const maxRetries = options?.maxRetries ?? 2;', 'const maxRetries = options?.maxRetries ?? 1;');

fs.writeFileSync('src/services/supabaseService.ts', content, 'utf8');
console.log('maxRetries default updated to 1');
