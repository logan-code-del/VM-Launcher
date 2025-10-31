#!/usr/bin/env node
const { execSync } = require('child_process');
const http = require('http');
const fs = require('fs');
const path = require('path');

const DIST = path.join(__dirname, '..', 'dist');
const PORT = process.env.PORT || 3000;

function build() {
  console.log('Running webpack build...');
  execSync('npm run build', { stdio: 'inherit' });
}

function mimeType(ext) {
  const map = {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon'
  };
  return map[ext.toLowerCase()] || 'application/octet-stream';
}

function serve() {
  if (!fs.existsSync(DIST)) {
    console.error('Dist folder not found:', DIST);
    process.exit(1);
  }

  const server = http.createServer((req, res) => {
    let reqPath = decodeURIComponent(req.url.split('?')[0]);
    if (reqPath === '/') reqPath = '/index.html';
    const filePath = path.join(DIST, reqPath);

    // security: ensure served file is inside DIST
    if (!filePath.startsWith(DIST)) {
      res.statusCode = 403;
      return res.end('Forbidden');
    }

    fs.stat(filePath, (err, stat) => {
      if (err) {
        // fallback to index.html for SPA
        const index = path.join(DIST, 'index.html');
        if (fs.existsSync(index)) {
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          fs.createReadStream(index).pipe(res);
        } else {
          res.statusCode = 404;
          res.end('Not found');
        }
        return;
      }

      if (stat.isDirectory()) {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        fs.createReadStream(path.join(filePath, 'index.html')).pipe(res);
        return;
      }

      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': mimeType(ext) });
      fs.createReadStream(filePath).pipe(res);
    });
  });

  server.listen(PORT, () => {
    console.log(`Serving ${DIST} at http://localhost:${PORT}`);
  });
}

// Run build then serve
try {
  build();
  serve();
} catch (e) {
  console.error(e);
  process.exit(1);
}
