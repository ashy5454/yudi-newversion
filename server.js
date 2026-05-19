const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;

const MIME_TYPES = {
    '.html': 'text/html; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
};

const server = http.createServer((req, res) => {
    // Parse URL
    const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
    let pathname = parsedUrl.pathname;
    
    // Redirects
    if (pathname === '/about' || pathname === '/about.html') {
        res.writeHead(301, { 'Location': '/lab' });
        res.end();
        return;
    }
    
    // Clean URLs: Default home to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    
    // Construct local file path
    let filePath = path.join(PUBLIC_DIR, pathname);
    
    // Check if file exists. If not, try appending .html (clean URLs)
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            const htmlFilePath = filePath + '.html';
            fs.stat(htmlFilePath, (htmlErr, htmlStats) => {
                if (!htmlErr && htmlStats.isFile()) {
                    serveFile(htmlFilePath, res);
                } else {
                    // Serve 404
                    res.writeHead(404, { 'Content-Type': 'text/plain' });
                    res.end('404 Not Found');
                }
            });
        } else {
            serveFile(filePath, res);
        }
    });
});

function serveFile(filePath, res) {
    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    
    fs.readFile(filePath, (err, content) => {
        if (err) {
            res.writeHead(500, { 'Content-Type': 'text/plain' });
            res.end(`Server Error: ${err.code}`);
        } else {
            res.writeHead(200, { 'Content-Type': contentType });
            res.end(content, 'utf-8');
        }
    });
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running at http://localhost:${PORT}/`);
});
