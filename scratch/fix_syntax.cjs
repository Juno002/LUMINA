const fs = require('fs');

let app = fs.readFileSync('src/App.tsx', 'utf8');
app = app.replace(/animate=\{\{ opacity: 1, y: 0, filter: 'blur\\(0px\\)' \}\} transition=\{\{ duration: AnimationSpeeds\.fluid, ease: EasingCurves\.editorial \}\}[\s\S]*?className=\"flex-grow pb-32 md:pb-20\"/m, 'animate={{ opacity: 1, y: 0, filter: \\'blur(0px)\\' }}\\n                exit={{ opacity: 0, y: -15, filter: \\'blur(10px)\\' }}\\n                transition={{ duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}\\n                className="flex-grow pb-32 md:pb-20"');
fs.writeFileSync('src/App.tsx', app);

let ana = fs.readFileSync('src/ui/views/AnalysisView.tsx', 'utf8');
ana = ana.replace(/animate=\{\{ width: \`\\\$\\{Math\.min\\(\\(d\.count \/ 10\\) \* 100, 100\\)\\}%\` \\} transition=\{\{ duration: AnimationSpeeds\.fluid, ease: EasingCurves\.editorial \}\\}\\}/, 'animate={{ width: `${Math.min((d.count / 10) * 100, 100)}%` }}\\n                        transition={{ delay: i * 0.1, duration: AnimationSpeeds.fluid, ease: EasingCurves.editorial }}');
fs.writeFileSync('src/ui/views/AnalysisView.tsx', ana);
