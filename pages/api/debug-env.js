// Debug endpoint to check environment variables
export default function handler(req, res) {
  try {
    // Check if GitHub environment variables are set
    const githubToken = process.env.GITHUB_TOKEN;
    const githubOwner = process.env.GITHUB_OWNER;
    const githubRepo = process.env.GITHUB_REPO;
    const githubBranch = process.env.GITHUB_BRANCH || 'main';
    
    const githubConfigured = !!(githubToken && githubOwner && githubRepo);
    
    // Don't return the actual token for security reasons
    res.status(200).json({
      success: true,
      githubConfigured,
      environment: process.env.NODE_ENV,
      config: {
        owner: githubOwner ? githubOwner : undefined,
        repo: githubRepo ? githubRepo : undefined,
        branch: githubBranch,
        token: githubToken ? '**present**' : undefined
      }
    });
  } catch (error) {
    console.error('Error in debug-env endpoint:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error accessing environment variables', 
      error: error.message 
    });
  }
} 