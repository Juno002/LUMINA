const fs = require('fs'); const path = require('path');
function processDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      if (content.includes('import { motion')) {
        if (!content.includes('Theme')) {
           let relativePrefix = '../../domain/constants/Theme';
           if (fullPath.includes('src\\\\App.tsx') || fullPath.includes('src/App.tsx')) relativePrefix = './domain/constants/Theme';
           else if (fullPath.includes('components')) relativePrefix = '../../../domain/constants/Theme';
           
           content = content.replace(/import \{.*motion.*\} from ['"]motion\/react['"];/, '$&\nimport { AnimationSpeeds, EasingCurves } from \'' + relativePrefix + '\';');
        }
        
        content = content.replace(/(animate=\{[^{}]*\{[^}]*\}[^{}]*\}|animate=\{\{[^}]*\}\})(?!\s*transition)/g, '$1 transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}');
        
        fs.writeFileSync(fullPath, content);
      }
    }
  }
}
processDir('src');
