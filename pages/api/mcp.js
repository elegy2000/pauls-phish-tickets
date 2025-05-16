import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';

const VERCEL_PROJECT_NAME = 'pauls-phish-tickets';
const VERCEL_API_BASE = 'https://api.vercel.com';
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

const VER_TOOL_LIST = [
  {
    name: 'echo',
    description: 'Echoes back the input string.',
    parameters: {
      type: 'object',
      properties: {
        message: { type: 'string', description: 'Message to echo' }
      },
      required: ['message']
    }
  },
  {
    name: 'get_server_info',
    description: 'Returns server status, version, and environment info.',
    parameters: { type: 'object', properties: {}, required: [] }
  },
  {
    name: 'get_logs',
    description: 'Fetches recent Vercel deployment logs.',
    parameters: {
      type: 'object',
      properties: {
        limit: { type: 'integer', description: 'Number of log entries to fetch', default: 10 }
      },
      required: []
    }
  },
  {
    name: 'deploy',
    description: 'Triggers a new deployment on Vercel.',
    parameters: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Vercel project name' }
      },
      required: ['project']
    }
  },
  {
    name: 'list_deployments',
    description: 'Lists recent Vercel deployments for your project.',
    parameters: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Vercel project name' },
        limit: { type: 'integer', description: 'Number of deployments to list', default: 5 }
      },
      required: ['project']
    }
  },
  {
    name: 'get_env_vars',
    description: 'Lists environment variables for the Vercel project.',
    parameters: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Vercel project name' }
      },
      required: ['project']
    }
  },
  {
    name: 'set_env_var',
    description: 'Sets or updates an environment variable.',
    parameters: {
      type: 'object',
      properties: {
        project: { type: 'string', description: 'Vercel project name' },
        key: { type: 'string', description: 'Environment variable key' },
        value: { type: 'string', description: 'Environment variable value' },
        target: { type: 'string', description: 'Target environment (production, preview, development)', default: 'production' }
      },
      required: ['project', 'key', 'value']
    }
  },
  {
    name: 'list_files',
    description: 'Lists files in a given directory.',
    parameters: {
      type: 'object',
      properties: {
        dir: { type: 'string', description: 'Directory path', default: '.' }
      },
      required: []
    }
  }
];

async function runTool(tool, params) {
  switch (tool) {
    case 'echo':
      return { message: params.message };
    case 'get_server_info':
      return {
        status: 'ok',
        version: '1.0.0',
        env: process.env.NODE_ENV || 'development',
        time: new Date().toISOString()
      };
    case 'get_logs': {
      // Fetch logs for the latest deployment
      const limit = params.limit || 10;
      const deploymentsRes = await fetch(`${VERCEL_API_BASE}/v6/deployments?project=${VERCEL_PROJECT_NAME}&limit=1`, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
      });
      const deploymentsData = await deploymentsRes.json();
      if (!deploymentsData.deployments || deploymentsData.deployments.length === 0) {
        return { logs: [], error: 'No deployments found.' };
      }
      const deploymentId = deploymentsData.deployments[0].uid;
      const logsRes = await fetch(`${VERCEL_API_BASE}/v2/deployments/${deploymentId}/events?limit=${limit}`, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
      });
      const logsData = await logsRes.json();
      return { logs: logsData.events || [] };
    }
    case 'deploy': {
      // Trigger a new deployment (requires a GitHub/GitLab/Bitbucket integration or a custom setup)
      // This is a placeholder: Vercel deployments are usually triggered by git push or API upload
      return { status: 'Deployment trigger via API is not implemented in this stub. Please deploy via git push.' };
    }
    case 'list_deployments': {
      const limit = params.limit || 5;
      const res = await fetch(`${VERCEL_API_BASE}/v6/deployments?project=${VERCEL_PROJECT_NAME}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
      });
      const data = await res.json();
      return { deployments: data.deployments || [] };
    }
    case 'get_env_vars': {
      const res = await fetch(`${VERCEL_API_BASE}/v9/projects/${VERCEL_PROJECT_NAME}/env`, {
        headers: { Authorization: `Bearer ${VERCEL_TOKEN}` }
      });
      const data = await res.json();
      return { envs: data.envs || [] };
    }
    case 'set_env_var': {
      const { key, value, target } = params;
      const res = await fetch(`${VERCEL_API_BASE}/v9/projects/${VERCEL_PROJECT_NAME}/env`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${VERCEL_TOKEN}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          key,
          value,
          target: [target || 'production'],
          type: 'encrypted'
        })
      });
      const data = await res.json();
      return { result: data };
    }
    case 'list_files':
      try {
        const dirPath = params.dir || '.';
        const files = fs.readdirSync(dirPath);
        return { files };
      } catch (e) {
        return { error: e.message };
      }
    default:
      return { error: 'Unknown tool' };
  }
}

export default async function handler(req, res) {
  if (req.headers.accept === 'text/event-stream') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    const interval = setInterval(() => {
      res.write('event: keepalive\ndata: {}\n\n');
    }, 15000);
    res.on('close', () => {
      clearInterval(interval);
      res.end();
    });
    res.write('event: connected\ndata: {}\n\n');
    return;
  }
  if (req.method === 'GET') {
    return res.status(200).json({
      message: 'Vercel MCP Server is running',
      version: '1.0.0',
      tools: VER_TOOL_LIST
    });
  }
  if (req.method === 'POST') {
    try {
      const { tool, params } = req.body;
      const result = await runTool(tool, params || {});
      return res.status(200).json({ result });
    } catch (error) {
      return res.status(500).json({ error: error.message });
    }
  }
  return res.status(405).json({ error: 'Method not allowed' });
} 