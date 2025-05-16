# Deployment Instructions for Paul's Phish Tickets Archive

This document explains how to deploy the site to GitHub Pages and transfer ownership.

## Step 1: Create the Deployment Package

We've already created a deployment package for you. You can find it in the `deploy-package` directory.

## Step 2: Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and log in to your account
2. Click on the "+" icon in the top right corner and select "New repository"
3. Name the repository `pauls-phish-tickets`
4. Add a description: "Paul's Phish Tickets Archive"
5. Make it a public repository
6. Do not initialize with a README, .gitignore, or license
7. Click "Create repository"

## Step 3: Upload the Deployment Package

You have two options:

### Option 1: Using the GitHub Website

1. Go to your newly created repository
2. Click on "uploading an existing file" link
3. Drag and drop all files from the `deploy-package` directory
4. Click "Commit changes"

### Option 2: Using Git Command Line

1. Navigate to the deploy-package directory:
   ```
   cd deploy-package
   ```

2. Initialize a git repository:
   ```
   git init
   git add .
   git commit -m "Initial commit"
   ```

3. Connect to your GitHub repository (replace YOUR_USERNAME):
   ```
   git remote add origin https://github.com/YOUR_USERNAME/pauls-phish-tickets.git
   git push -u origin master
   ```

## Step 4: Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. In the left sidebar, click on "Pages"
4. Under "Build and deployment", select "Deploy from a branch"
5. Select the `main` branch (or `master` if that's what you used) and `/ (root)` folder
6. Click "Save"

Your site will be deployed in a few minutes. You can check the deployment status in the "Actions" tab.

## Step 5: Custom Domain (Optional)

If you want to use a custom domain:

1. Edit the `CNAME` file in your repository to contain your custom domain (instead of example.com)
2. Go to your repository settings
3. Scroll down to the "GitHub Pages" section
4. In the "Custom domain" field, enter your domain name and click "Save"
5. Update your domain's DNS settings:
   - For an apex domain (example.com), add A records pointing to:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - For a subdomain (www.example.com), add a CNAME record pointing to `YOUR_USERNAME.github.io`

## Step 6: Transfer Ownership

When you're ready to transfer the repository to another user:

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to the "Danger Zone" section
4. Click on "Transfer ownership"
5. Enter the repository name to confirm
6. Enter the GitHub username of the new owner
7. Click "I understand, transfer this repository"

The new owner will receive an email with instructions to accept the transfer. 