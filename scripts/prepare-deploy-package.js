// This script prepares a deployment package that can be easily shared
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Build the project
console.log('Building the project...');
execSync('npm run build', { stdio: 'inherit' });

// Create a deployment package directory
const packageDir = path.join(process.cwd(), 'deploy-package');
if (fs.existsSync(packageDir)) {
  console.log('Removing existing deploy-package directory...');
  execSync(`rm -rf ${packageDir}`, { stdio: 'inherit' });
}

console.log('Creating new deploy-package directory...');
fs.mkdirSync(packageDir, { recursive: true });

// Copy necessary files to the package
console.log('Preparing deployment package...');

// Copy the out directory (Next.js build output)
console.log('Copying build output...');
execSync(`cp -r ${path.join(process.cwd(), 'out')}/* ${packageDir}/`, { stdio: 'inherit' });

// Create GitHub workflows directory
console.log('Setting up GitHub workflows...');
const workflowsDir = path.join(packageDir, '.github', 'workflows');
fs.mkdirSync(workflowsDir, { recursive: true });

// Copy GitHub workflow file
const deployYmlSource = path.join(process.cwd(), '.github', 'workflows', 'deploy.yml');
const deployYmlDest = path.join(workflowsDir, 'deploy.yml');
fs.copyFileSync(deployYmlSource, deployYmlDest);

// Create .nojekyll file
console.log('Creating .nojekyll file...');
fs.writeFileSync(path.join(packageDir, '.nojekyll'), '');

// Copy example CNAME file
console.log('Copying CNAME example...');
const cnameSource = path.join(process.cwd(), 'public', 'CNAME.example');
if (fs.existsSync(cnameSource)) {
  fs.copyFileSync(cnameSource, path.join(packageDir, 'CNAME'));
}

// Create a basic README for the deployment package
console.log('Creating README...');
const readmeContent = `# Paul's Phish Tickets Archive - Deployment Package

This package contains all the files needed to deploy the Paul's Phish Tickets Archive to GitHub Pages.

## Deployment Instructions

1. Create a new GitHub repository named \`pauls-phish-tickets\` (or any name you prefer)
2. Push these files to the repository
3. Go to the repository Settings > Pages
4. Under "Build and deployment", select "Deploy from a branch"
5. Select the \`main\` branch and \`/ (root)\` folder, then click Save

Your site should now be deployed to GitHub Pages!

The site will be available at: https://YOUR_USERNAME.github.io/REPOSITORY_NAME

## Custom Domain Setup (Optional)

If you want to use a custom domain:
1. Edit the CNAME file to contain your custom domain
2. In the repository Settings > Pages, enter your custom domain name
`;
fs.writeFileSync(path.join(packageDir, 'README.md'), readmeContent);

console.log('\nDeployment package created successfully!');
console.log(`You can find the package in the '${packageDir}' directory.`);
console.log('');
console.log('To deploy:');
console.log('1. Create a new GitHub repository');
console.log('2. Upload the contents of the deploy-package directory to the repository');
console.log('3. Configure GitHub Pages in the repository settings'); 