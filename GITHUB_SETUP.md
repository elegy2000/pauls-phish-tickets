# GitHub Setup Instructions

Follow these steps to set up your GitHub repository and deploy the site to GitHub Pages:

## 1. Create a GitHub Repository

1. Go to [GitHub](https://github.com) and log in to your account
2. Click on the "+" icon in the top right corner and select "New repository"
3. Name the repository `pauls-phish-tickets`
4. Add a description: "Paul's Phish Tickets Archive"
5. Leave it as a public repository
6. Do not initialize with a README, .gitignore, or license (since we already have a local repository)
7. Click "Create repository"

## 2. Connect Your Local Repository

After creating the repository, you'll see instructions to push an existing repository. 
Run these commands in your terminal, replacing `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin git@github.com:YOUR_USERNAME/pauls-phish-tickets.git
git push -u origin main
```

## 3. Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to the "GitHub Pages" section
4. Under "Source", select "GitHub Actions"
5. The GitHub Actions workflow we've set up will build and deploy your site automatically

## 4. Update the README.md

After deploying, update the README.md file to include your actual GitHub Pages URL:

```bash
# Edit README.md and update the URL in the "Live Demo" section
# For example:
# Visit the live site: [Paul's Phish Tickets Archive](https://YOUR_USERNAME.github.io/pauls-phish-tickets)
```

## 5. Domain Transfer

If you want to use a custom domain:

1. Go to your repository settings
2. Scroll down to the "GitHub Pages" section
3. In the "Custom domain" field, enter your domain name and click "Save"
4. Update your domain's DNS settings to point to GitHub Pages:
   - Add an A record pointing to the GitHub Pages IP addresses:
     - 185.199.108.153
     - 185.199.109.153
     - 185.199.110.153
     - 185.199.111.153
   - Or add a CNAME record pointing to `YOUR_USERNAME.github.io`

5. Check "Enforce HTTPS" once your SSL certificate is issued

## 6. Automatic Deployment

The site will be automatically deployed when you push changes to the `main` branch.
You can also manually trigger a deployment from the "Actions" tab on your GitHub repository. 