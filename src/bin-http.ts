#!/usr/bin/env node
/**
 * APIClaw HTTP API Server - Standalone executable
 * Usage: apiclaw-http [--port 3000]
 */

import { startHTTPServer } from './http-api.js';

const args = process.argv.slice(2);
let port = 3000;

// Parse args
for (let i = 0; i < args.length; i++) {
  if (args[i] === '--port' || args[i] === '-p') {
    port = parseInt(args[i + 1] || '3000');
    i++;
  } else if (args[i] === '--help' || args[i] === '-h') {
    console.log(`
🦞 APIClaw HTTP API Server

Usage:
  apiclaw-http [options]

Options:
  --port, -p <port>    Port to listen on (default: 3000)
  --help, -h           Show this help

Examples:
  apiclaw-http
  apiclaw-http --port 8080

Endpoints:
  GET  /api/discover?query=...&agentId=...
  POST /api/call_api
       Body: { provider, action, params, agentId }
  GET  /health

Auth:
  Whitelist-based for Hivr bees. Contact admin@nordsym.com for access.
`);
    process.exit(0);
  }
}

startHTTPServer(port);
