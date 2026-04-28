const fs = require('fs');
const file = 'src/app/add-property/__tests__/page.test.tsx';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
    'let rejectSubmit: ((reason?: unknown) => void) | null = null;',
    'let rejectSubmit: any = null;'
);

fs.writeFileSync(file, content, 'utf8');
console.log('Test file fixed');
