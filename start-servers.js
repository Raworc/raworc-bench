const { spawn } = require('child_process');

console.log('🚀 Starting both servers...\n');

// Start mock server
const mockServer = spawn('node', ['mock-server.js'], {
  stdio: 'inherit',
  shell: true
});

// Start Next.js dev server
const nextServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: true
});

// Handle process termination
process.on('SIGINT', () => {
  console.log('\n⏹️  Stopping servers...');
  mockServer.kill('SIGINT');
  nextServer.kill('SIGINT');
  process.exit(0);
});

mockServer.on('error', (error) => {
  console.error('Mock server error:', error);
});

nextServer.on('error', (error) => {
  console.error('Next.js server error:', error);
});

console.log('📋 Both servers are starting...');
console.log('🔧 Mock API will be available at: http://localhost:9000');
console.log('🌐 Next.js app will be available at: http://localhost:3000');
console.log('📝 Test credentials: admin / password');
