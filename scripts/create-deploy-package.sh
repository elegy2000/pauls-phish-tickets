#!/bin/bash

# Build the project
echo "Building the project..."
npm run build

# Remove the existing deploy-package directory if it exists
if [ -d "deploy-package" ]; then
  echo "Removing existing deploy-package directory..."
  rm -rf deploy-package
fi

# Create a new deploy-package directory
echo "Creating new deploy-package directory..."
mkdir -p deploy-package

# Copy the build output
echo "Copying build output..."
cp -r out/* deploy-package/

# Create GitHub workflows directory
echo "Setting up GitHub workflows..."
mkdir -p deploy-package/.github/workflows

# Copy GitHub workflow file
cp .github/workflows/deploy.yml deploy-package/.github/workflows/

# Create .nojekyll file
echo "Creating .nojekyll file..."
touch deploy-package/.nojekyll

# Copy example CNAME file
echo "Copying CNAME example..."
if [ -f "public/CNAME.example" ]; then
  cp public/CNAME.example deploy-package/CNAME
fi

# Create a basic README for the deployment package
echo "Creating README..."
cat > deploy-package/README.md << 'EOF'
# Paul's Phish Tickets Archive - Deployment Package

This package contains all the files needed to deploy the Paul's Phish Tickets Archive to GitHub Pages.

## Deployment Instructions

1. Create a new GitHub repository named `pauls-phish-tickets` (or any name you prefer)
2. Push these files to the repository
3. Go to the repository Settings > Pages
4. Under "Build and deployment", select "Deploy from a branch"
5. Select the `main` branch and `/ (root)` folder, then click Save

Your site should now be deployed to GitHub Pages!

The site will be available at: https://YOUR_USERNAME.github.io/REPOSITORY_NAME

## Custom Domain Setup (Optional)

If you want to use a custom domain:
1. Edit the CNAME file to contain your custom domain
2. In the repository Settings > Pages, enter your custom domain name
EOF

echo -e "\nDeployment package created successfully!"
echo "You can find the package in the 'deploy-package' directory."
echo ""
echo "To deploy:"
echo "1. Create a new GitHub repository"
echo "2. Upload the contents of the deploy-package directory to the repository"
echo "3. Configure GitHub Pages in the repository settings" 