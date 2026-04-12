const fs = require('fs');
const path = require('path');

const directoryPath = path.join(process.cwd(), 'apps', 'web', 'src');

const replacements = [
  { pattern: /text-\[0\.95rem\]/g, replacement: 'text-sm' },
  { pattern: /text-\[1\.18rem\]/g, replacement: 'text-lg' },
  { pattern: /text-\[15px\]/g, replacement: 'text-sm' },
  { pattern: /text-\[11px\]/g, replacement: 'text-xs' },
  { pattern: /text-\[10px\]/g, replacement: 'text-xs' },
  { pattern: /min-h-\[320px\]/g, replacement: 'min-h-80' },
  { pattern: /min-h-\[40vh\]/g, replacement: 'min-h-96' },
  { pattern: /min-h-\[70vh\]/g, replacement: 'min-h-screen' },
  { pattern: /min-h-\[18rem\]/g, replacement: 'min-h-72' },
  { pattern: /pb-\[env\(safe-area-inset-bottom\)\]/g, replacement: 'pb-4' },
  { pattern: /shadow-\[0_20px_50px_rgba\(0,0,0,0\.15\)\]/g, replacement: 'shadow-2xl' },
  { pattern: /shadow-\[0_12px_28px_-20px_rgba\(15,23,42,0\.24\)\]/g, replacement: 'shadow-md' },
  { pattern: /shadow-\[0_10px_18px_-14px_rgba\(15,23,42,0\.55\)\]/g, replacement: 'shadow-md' },
  { pattern: /shadow-\[0_18px_42px_-30px_rgba\(15,23,42,0\.24\)\]/g, replacement: 'shadow-lg' },
  { pattern: /shadow-\[0_14px_30px_-24px_rgba\(15,23,42,0\.28\)\]/g, replacement: 'shadow-md' },
  { pattern: /shadow-\[0_12px_28px_-16px_rgba\(37,99,235,0\.8\)\]/g, replacement: 'shadow-xl shadow-blue-500/20' },
  { pattern: /shadow-\[0_8px_20px_-16px_rgba\(15,23,42,0\.15\)\]/g, replacement: 'shadow-sm' },
  { pattern: /active:scale-\[0\.98\]/g, replacement: 'active:scale-95' }
];

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  files.forEach(file => {
    const fullPath = path.join(dirPath, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      let original = content;
      
      replacements.forEach(({ pattern, replacement }) => {
        content = content.replace(pattern, replacement);
      });
      
      if (content !== original) {
        console.log(`Updated ${fullPath}`);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  });
}

processDirectory(directoryPath);
