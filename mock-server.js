// Simple mock server for testing Raworc Bench UI
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 9000;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Mock data
let workspaces = [
  {
    id: 'ws-1',
    name: 'Development Environment',
    description: 'Main development workspace',
    created_at: '2024-01-15T10:00:00Z',
    updated_at: '2024-01-15T10:00:00Z'
  },
  {
    id: 'ws-2', 
    name: 'Testing Environment',
    description: 'QA and testing workspace',
    created_at: '2024-01-16T10:00:00Z',
    updated_at: '2024-01-16T10:00:00Z'
  }
];

let sessions = {
  'ws-1': [
    {
      id: 'sess-1',
      workspace_id: 'ws-1',
      name: 'Web Server',
      status: 'running',
      created_at: '2024-01-15T11:00:00Z',
      updated_at: '2024-01-15T11:00:00Z',
      container_info: {
        image: 'nginx:latest',
        ports: [80, 443],
        environment: { ENV: 'development' }
      }
    },
    {
      id: 'sess-2',
      workspace_id: 'ws-1', 
      name: 'Database',
      status: 'stopped',
      created_at: '2024-01-15T11:30:00Z',
      updated_at: '2024-01-15T11:30:00Z',
      container_info: {
        image: 'postgres:14',
        ports: [5432],
        environment: { POSTGRES_DB: 'testdb' }
      }
    }
  ],
  'ws-2': []
};

// Auth endpoints
app.post('/api/v0/auth/internal', (req, res) => {
  const { user, pass } = req.body;
  
  // Simple auth check
  if (user === 'admin' && pass === 'password') {
    res.json({
      token: 'mock-jwt-token-12345',
      token_type: 'Bearer',
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    });
  } else {
    res.status(401).json({ message: 'Invalid credentials' });
  }
});

app.get('/api/v0/auth/me', (req, res) => {
  const auth = req.headers.authorization;
  
  if (auth === 'Bearer mock-jwt-token-12345') {
    res.json({
      id: 'user-1',
      username: 'admin',
      email: 'admin@example.com',
      roles: ['admin', 'user']
    });
  } else {
    res.status(401).json({ message: 'Unauthorized' });
  }
});

// System endpoints
app.get('/api/v0/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.get('/api/v0/version', (req, res) => {
  res.json({ version: '1.0.0', build: 'mock-build-123' });
});

// Workspace endpoints
app.get('/api/v0/workspaces', (req, res) => {
  res.json(workspaces);
});

app.post('/api/v0/workspaces', (req, res) => {
  const newWorkspace = {
    id: `ws-${Date.now()}`,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  workspaces.push(newWorkspace);
  res.json(newWorkspace);
});

app.delete('/api/v0/workspaces/:id', (req, res) => {
  workspaces = workspaces.filter(ws => ws.id !== req.params.id);
  res.json({ success: true });
});

// Session endpoints
app.get('/api/v0/workspaces/:workspaceId/sessions', (req, res) => {
  const workspaceSessions = sessions[req.params.workspaceId] || [];
  res.json(workspaceSessions);
});

app.post('/api/v0/workspaces/:workspaceId/sessions', (req, res) => {
  const newSession = {
    id: `sess-${Date.now()}`,
    workspace_id: req.params.workspaceId,
    ...req.body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  
  if (!sessions[req.params.workspaceId]) {
    sessions[req.params.workspaceId] = [];
  }
  sessions[req.params.workspaceId].push(newSession);
  res.json(newSession);
});

app.post('/api/v0/workspaces/:workspaceId/sessions/:sessionId/start', (req, res) => {
  const workspaceSessions = sessions[req.params.workspaceId] || [];
  const session = workspaceSessions.find(s => s.id === req.params.sessionId);
  
  if (session) {
    session.status = 'running';
    session.updated_at = new Date().toISOString();
    res.json(session);
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
});

app.post('/api/v0/workspaces/:workspaceId/sessions/:sessionId/stop', (req, res) => {
  const workspaceSessions = sessions[req.params.workspaceId] || [];
  const session = workspaceSessions.find(s => s.id === req.params.sessionId);
  
  if (session) {
    session.status = 'stopped';
    session.updated_at = new Date().toISOString();
    res.json(session);
  } else {
    res.status(404).json({ message: 'Session not found' });
  }
});

app.delete('/api/v0/workspaces/:workspaceId/sessions/:sessionId', (req, res) => {
  if (sessions[req.params.workspaceId]) {
    sessions[req.params.workspaceId] = sessions[req.params.workspaceId]
      .filter(s => s.id !== req.params.sessionId);
  }
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock Raworc server running on http://localhost:${PORT}`);
  console.log('📋 Test credentials:');
  console.log('   Username: admin');
  console.log('   Password: password');
  console.log('   Server URL: http://localhost:9000');
});
