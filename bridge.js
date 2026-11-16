const http = require('http');
const fs = require('fs');
const path = require('path');

let latestState = null;
let lastReceivedAt = 0;

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    return res.end();
  }

  // Endpoint penerima data dari MetaTrader 5
  if (req.method === 'POST' && req.url === '/api/mt5') {
    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      try {
        latestState = JSON.parse(body);
        lastReceivedAt = Date.now();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end('{"ok":true}');
      } catch (e) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end('{"ok":false}');
      }
    });
    return;
  }

  // Endpoint pembaca status live untuk index.html
  if (req.method === 'GET' && req.url === '/api/status') {
    const ageSec = lastReceivedAt ? Math.floor((Date.now() - lastReceivedAt) / 1000) : null;
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({
      connected: ageSec !== null && ageSec <= 10,
      age_sec: ageSec,
      data: latestState
    }));
  }

  // Sajikan file index.html
  if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const htmlPath = path.join(__dirname, 'index.html');
    fs.readFile(htmlPath, (err, content) => {
      if (err) {
        res.writeHead(404);
        return res.end('File index.html tidak ditemukan di folder yang sama dengan bridge.js');
      }
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      res.end(content);
    });
    return;
  }

  res.writeHead(404);
  res.end('Not Found');
});

server.listen(3000, '127.0.0.1', () => {
  console.log('Bridge MT5 <-> Web aktif di http://127.0.0.1:3000');
});
