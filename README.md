# Raworc Bench

A modern web interface for managing containerized workspaces and sessions. Built with Next.js, TypeScript, and Tailwind CSS with full dark/light theme support.

## Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. **Clone and install dependencies:**
   ```bash
   git clone <repository-url>
   cd raworc-bench
   npm install
   ```

2. **Start both servers (recommended):**
   ```bash
   npm run dev:all
   ```
   This starts both the Next.js client and mock API server simultaneously.

3. **Or start servers separately:**
   ```bash
   # Terminal 1 - Start mock API server
   node mock-server.js
   
   # Terminal 2 - Start Next.js client
   npm run dev
   ```

### Access the Application

- **Web Application**: http://localhost:3000
- **Mock API Server**: http://localhost:9000

### Login Credentials

```
Username: admin
Password: password
```

## Features

- 🖥️ **Workspace Management** - Create and manage development environments
- 🐳 **Session Control** - Start, stop, and monitor containerized sessions
- 🌙 **Dark/Light Theme** - Toggle between themes with persistent preference
- 📱 **Responsive Design** - Works on desktop and mobile devices
- 🔒 **Authentication** - Secure login with session management
- ⚡ **Real-time Updates** - Live status updates for sessions and workspaces

## Available Scripts

- `npm run dev` - Start Next.js development server only
- `npm run dev:all` - Start both client and API servers
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Project Structure

```
raworc-bench/
├── src/
│   ├── app/           # Next.js app router
│   ├── components/    # React components
│   ├── contexts/      # React contexts (Auth, Theme)
│   ├── lib/          # Utility functions
│   └── types/        # TypeScript type definitions
├── mock-server.js    # Express.js mock API
└── public/          # Static assets
```

## Development

The application includes:
- Hot reload for development
- TypeScript support
- ESLint configuration
- Tailwind CSS for styling
- Mock API for testing

For detailed development information, see [RAWORC_BENCH_GUIDE.md](./RAWORC_BENCH_GUIDE.md).