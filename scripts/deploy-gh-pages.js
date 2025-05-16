// Manual deployment script for GitHub Pages
const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Build the project
console.log('Building the project...');
execSync('npm run build', { stdio: 'inherit' });

// The output directory should be './out'
const outDir = path.join(process.cwd(), 'out');

// Create a .nojekyll file to prevent GitHub Pages from ignoring files that begin with an underscore
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

console.log('Deploying to GitHub Pages...');
console.log('You can now push the `out` directory to the `gh-pages` branch of your repository.');
console.log('Example commands:');
console.log('git add out -f');
console.log('git commit -m "Deploy to GitHub Pages"');
console.log('git subtree push --prefix out origin gh-pages');

console.log('\nAlternatively, GitHub Actions will automatically deploy your site when you push to main.'); 