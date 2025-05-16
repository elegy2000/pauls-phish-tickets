# GitHub & Vercel Persistence Setup

This guide explains how to set up the GitHub repository integration for data persistence on the Paul Phish Tickets website.

## Overview

The website now uses a GitHub-based persistence system that:
1. Allows admins to upload CSV files and images through the admin interface
2. Automatically commits changes to the GitHub repository
3. Triggers a Vercel redeployment to update the live site

## Setup Steps

### 1. Create a GitHub Personal Access Token

1. Go to [GitHub Personal Access Tokens](https://github.com/settings/tokens)
2. Click "Generate new token" (classic)
3. Give it a name like "Paul Phish Tickets Admin"
4. Select the `repo` scope (this gives access to the repository)
5. Click "Generate token" and **save the token** - it won't be shown again!

### 2. Configure Vercel Environment Variables

1. Go to your Vercel dashboard for the project
2. Click on "Settings" → "Environment Variables"
3. Add the following environment variables:

| Name | Value | Example |
|------|-------|---------|
| `GITHUB_TOKEN` | Your GitHub personal access token | `ghp_YourTokenHere...` |
| `GITHUB_OWNER` | GitHub username or organization | `your-username` |
| `GITHUB_REPO` | Repository name | `Paul-Phish-Tickets` |
| `GITHUB_BRANCH` | Main branch name | `main` or `master` |

### 3. Create a Vercel Deploy Hook

1. In your Vercel project dashboard, go to "Settings" → "Git"
2. Scroll down to "Deploy Hooks"
3. Create a new hook named "Admin Update"
4. Select the branch to deploy (usually `main`)
5. Click "Create Hook" and copy the URL
6. Add another environment variable:

| Name | Value | Example |
|------|-------|---------|
| `VERCEL_DEPLOY_HOOK` | The deploy hook URL | `https://api.vercel.com/v1/...` |

### 4. Redeploy Your Application

1. Trigger a manual deployment from the Vercel dashboard to apply these changes

## Manual Deployment

If changes don't appear to be deploying automatically:

1. Go to the Vercel dashboard for your project
2. Navigate to the "Deployments" tab
3. Click "Redeploy" on the latest deployment, or 
4. Use the Deploy Hook URL to trigger a new build:
   ```
   curl -X POST https://api.vercel.com/v1/hooks/your-deploy-hook-id
   ```

## How It Works

- When an admin uploads a CSV file or adds/edits a ticket, the data is:
  1. Saved locally for immediate access
  2. Committed to the GitHub repository
  3. A new deployment is triggered automatically
  
- There is typically a 1-2 minute delay before changes appear on the live site

## Troubleshooting

If changes aren't persisting:

1. Check the Vercel Function Logs for any error messages
2. Verify that all environment variables are set correctly
3. Ensure the GitHub token has the `repo` scope
4. Check that the deploy hook is working by testing it manually

## Support

For assistance, contact the developer who set up this system. 