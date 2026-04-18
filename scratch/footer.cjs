const fs = require('fs');
let c = fs.readFileSync('src/App.tsx', 'utf8');
c = c.replace(/className=\"text-\[7px\] uppercase tracking-\[0\.2em\] font-bold\"/g, 'className="text-[7px] uppercase tracking-[0.2em] font-bold hidden sm:block"');
fs.writeFileSync('src/App.tsx', c);
