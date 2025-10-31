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

function copyPublic() {
  const PUBLIC = path.join(__dirname, '..', 'public');
  if (!fs.existsSync(PUBLIC)) return;
  // copy public/* to dist/, preserving directory structure
  try {
    // Node 16.7+ has fs.cp which can copy recursively
    if (typeof fs.cp === 'function') {
      fs.cpSync(PUBLIC, DIST, { recursive: true });
    } else {
      // fallback: copy files manually
      const entries = fs.readdirSync(PUBLIC, { withFileTypes: true });
      for (const e of entries) {
        const src = path.join(PUBLIC, e.name);
        const dest = path.join(DIST, e.name);
        if (e.isDirectory()) {
          fs.mkdirSync(dest, { recursive: true });
          const sub = fs.readdirSync(src);
          for (const f of sub) {
            fs.copyFileSync(path.join(src, f), path.join(dest, f));
          }
        } else {
          fs.copyFileSync(src, dest);
        }
      }
    }
    console.log('Copied public/ -> dist/');
  } catch (err) {
    console.warn('Failed to copy public to dist:', err.message);
  }
}

function copySrcStyles() {
  const SRC_STYLE = path.join(__dirname, '..', 'src', 'styles', 'main.css');
  const DEST_DIR = path.join(DIST, 'styles');
  if (!fs.existsSync(SRC_STYLE)) return;
  try {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    fs.copyFileSync(SRC_STYLE, path.join(DEST_DIR, 'main.css'));
    console.log('Copied src/styles/main.css -> dist/styles/main.css');
  } catch (err) {
    console.warn('Failed to copy src/styles:', err.message);
  }
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
  copyPublic();
  copySrcStyles();
  serve();
} catch (e) {
  console.error(e);
  process.exit(1);
}
