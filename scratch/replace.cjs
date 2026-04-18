const fs = require('fs'); const path = require('path');
const { execSync } = require('child_process');

function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('shared/lib/utils')) {
        let regex = /import\s+\{([^}]+)\}\s+from\s+['"](.*?)shared\/lib\/utils['"];?/g;
        content = content.replace(regex, (match, importsStr, prefix) => {
          const imports = importsStr.split(',').map(i => i.trim()).filter(i => i);
          let newImports = [];
          const tw = imports.filter(i => i === 'cn');
          const dates = imports.filter(i => i === 'todayISO' || i === 'formatDate');
          const hap = imports.filter(i => i === 'triggerHaptic');
          const norm = imports.filter(i => i === 'normalizeText' || i === 'escapeHtml');
          
          if (tw.length) newImports.push(`import { ${tw.join(', ')} } from '${prefix}shared/utils/TailwindMerge';`);
          if (dates.length) newImports.push(`import { ${dates.join(', ')} } from '${prefix}shared/utils/DateFormatter';`);
          if (hap.length) newImports.push(`import { ${hap.join(', ')} } from '${prefix}shared/utils/Haptics';`);
          if (norm.length) newImports.push(`import { ${norm.join(', ')} } from '${prefix}shared/utils/StringNormalizer';`);
          
          return newImports.join('\n');
        });
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}
processDir('src');
