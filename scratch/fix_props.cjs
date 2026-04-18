const fs = require('fs');

function fixApp() {
  const file = 'src/App.tsx';
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('animate={{ opacity: 1, y: 0, filter: \'blur(0px)\' }} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}')) {
      lines[i] = lines[i].replace(' transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}', '');
    }
  }
  fs.writeFileSync(file, lines.join('\n'));
}

function fixAnalysis() {
  const file = 'src/ui/views/AnalysisView.tsx';
  let content = fs.readFileSync(file, 'utf8');
  let lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('animate={{ width: `${Math.min((d.count / 10) * 100, 100)}%` } transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}}')) {
      lines[i] = lines[i].replace('} transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}}', '}}');
      // and ensure the next line has transition
      if (!lines[i+1].includes('transition')) {
          lines.splice(i+1, 0, '                        transition={{ delay: i * 0.1, duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}');
      }
    }
  }
  fs.writeFileSync(file, lines.join('\n'));
}

fixApp();
fixAnalysis();
