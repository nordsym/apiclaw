// Isolated browser matrix. No production services or credentials are used.
const esbuild = require('esbuild');
const path = require('path');
const fs = require('fs');
const http = require('http');
const root = path.resolve(__dirname, '..');
const output = '/tmp/apiclaw-workspace-state-matrix';
fs.mkdirSync(output,{recursive:true});
esbuild.buildSync({entryPoints:[path.join(root,'landing/tests/workspace-state/matrix.tsx')],bundle:true,outfile:path.join(output,'matrix.js'),platform:'browser',jsx:'automatic',nodePaths:[path.join(root,'landing/node_modules')],tsconfig:path.join(root,'landing/tsconfig.json'),alias:{'next/navigation':path.join(root,'landing/tests/workspace-state/navigation.tsx'),'next/link':path.join(root,'landing/tests/workspace-state/navigation.tsx')},define:{'process.env':'{}','process.env.NODE_ENV':'"development"','process.env.NEXT_PUBLIC_CONVEX_URL':'"http://127.0.0.1:48732/mock"','process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY':'""'}});
if (!process.argv.includes('--build-only')) http.createServer((req,res)=>{res.setHeader('Content-Type',req.url==='/matrix.js'?'text/javascript':'text/html');res.end(req.url==='/matrix.js'?fs.readFileSync(path.join(output,'matrix.js')):'<!doctype html><html><body><h1>Workspace state regression matrix</h1><pre id="results">Running...</pre><div id="fixture"></div><script src="/matrix.js"></script></body></html>');}).listen(48732,'127.0.0.1',()=>console.log('Isolated matrix: http://127.0.0.1:48732'));
