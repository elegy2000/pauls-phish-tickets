# Manual GitHub Setup Instructions

Follow these steps to set up your GitHub repository and deploy the site to GitHub Pages:

## 1. Create a New GitHub Repository

1. Go to [GitHub](https://github.com) and log in to your account
2. Click on the "+" icon in the top right corner and select "New repository"
3. Name the repository `pauls-phish-tickets`
4. Add a description: "Paul's Phish Tickets Archive"
5. Make it a public repository
6. Do not initialize with a README, .gitignore, or license (since you already have a local repository)
7. Click "Create repository"

## 2. Connect Your Local Repository

After creating the repository, GitHub will show instructions for connecting your existing repository.
Run these commands in your terminal, replacing `YOUR_USERNAME` with your actual GitHub username:

```bash
git remote add origin https://github.com/YOUR_USERNAME/pauls-phish-tickets.git
git push -u origin main
```

## 3. Configure GitHub Pages

1. Go to your repository on GitHub
2. Click on "Settings"
3. In the left sidebar, click on "Pages"
4. Under "Build and deployment", select "GitHub Actions"
5. This will use the GitHub Actions workflow we've already set up

## 4. Transfer Repository Ownership (When Ready)

When you're ready to transfer ownership to another user:

1. Go to your repository on GitHub
2. Click on "Settings"
3. Scroll down to the "Danger Zone" section
4. Click on "Transfer ownership"
5. Enter the repository name to confirm
6. Enter the GitHub username of the new owner
7. Click "I understand, transfer this repository"

## 5. Custom Domain Setup (Optional)

If you want to use a custom domain:

1. Edit the `public/CNAME` file to contain your custom domain name (without comments)
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
6. Check "Enforce HTTPS" once your SSL certificate is issued

## 6. Update README with Live Site URL

After deploying, update the README.md file to include your actual GitHub Pages URL:

```markdown
## Live Demo

Visit the live site: [Paul's Phish Tickets Archive](https://YOUR_USERNAME.github.io/pauls-phish-tickets)
```

## 7. Troubleshooting

If you encounter issues:

- Check the "Actions" tab on GitHub to see if there are any workflow failures
- Ensure your repository is public (GitHub Pages is only available for public repositories with a free GitHub account)
- Make sure the workflow file (.github/workflows/deploy.yml) exists in your repository
- Verify that your Next.js configuration (next.config.js) is correctly set up for GitHub Pages 