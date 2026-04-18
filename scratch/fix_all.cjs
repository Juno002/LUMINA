const fs = require('fs');
const path = require('path');

function fixDir(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      fixDir(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes('} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}}')) {
         content = content.replace(/\} transition=\{\{ duration: AnimationSpeeds\.fluid, ease: EasingCurves\.editorial \}\}\}/g, '}}\n transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}');
         fs.writeFileSync(fullPath, content);
      }
    }
  }
}

fixDir('src');
