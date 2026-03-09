const http = require('http');
const fs   = require('fs');
const path = require('path');

const PORT = 7788;
const DIR  = __dirname;
const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css':  'text/css',
  '.js':   'application/javascript',
  '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  '.png':  'image/png',
  '.jpg':  'image/jpeg',
  '.svg':  'image/svg+xml',
};

http.createServer((req, res) => {
  let filePath = path.join(DIR, req.url === '/' ? 'index.html' : req.url);
  filePath = filePath.split('?')[0];
  try {
    const data = fs.readFileSync(filePath);
    const ext  = path.extname(filePath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'text/plain' });
    res.end(data);
  } catch (e) {
    res.writeHead(404);
    res.end('Not found');
  }
}).listen(PORT, () => {
  console.log('Server running at http://localhost:' + PORT);
});
