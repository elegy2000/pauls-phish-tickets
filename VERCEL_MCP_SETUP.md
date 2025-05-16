# Vercel MCP Setup

This document provides the specific configuration for your Vercel MCP setup.

## Environment Variables

These variables need to be set in your Vercel project:

```
# GitHub Authentication
[REDACTED]
GITHUB_OWNER=elegy2000
GITHUB_REPO=Paul-Phish-Tickets
GITHUB_BRANCH=main

# Vercel Deploy Hook
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/prj_3kq4VoeJ8OyejnVGe8v3qLDxUEqD/JE4tqdvUNt
```

## How to Set Up

1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add each of the variables above
4. Trigger a new deployment to apply the changes

## Testing

After setting up, test your Vercel deployment by:

1. Going to your site's admin page
2. Uploading a CSV file or image
3. Verifying that the changes persist after redeployment

## Important Security Note

The GitHub token shown above should be reset and replaced with a new one as it has been shared in this conversation. To generate a new token:

1. Go to GitHub → Settings → Developer settings → Personal access tokens
2. Revoke the current token
3. Generate a new token with the `repo` scope
4. Update the token in Vercel environment variables

## Local Development

To develop locally with this setup:

1. Create a `.env.local` file in your project with the same variables
2. Use the GitHub MCP Server for testing GitHub API interactions
3. Changes will be committed to GitHub and trigger a new Vercel deployment 