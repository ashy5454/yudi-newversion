const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3000;
const PUBLIC_DIR = __dirname;
const KNOWLEDGE_FILE = path.join(PUBLIC_DIR, 'chatbot_knowledge.json');

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

    if (pathname === '/admin' || pathname === '/admin.html') {
        res.writeHead(301, { 'Location': '/admin-dashboard' });
        res.end();
        return;
    }
    
    // Clean URLs: Default home to index.html
    if (pathname === '/') {
        pathname = '/index.html';
    }
    if (pathname === '/admin-dashboard') {
        pathname = '/admin-dashboard.html';
    }
    
    // ==========================================
    // API ENDPOINTS
    // ==========================================
    
    // 1. Chatbot Chat API
    if (pathname === '/api/chat' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                const userMessage = (data.message || '').trim().toLowerCase();
                
                // Read knowledge base
                fs.readFile(KNOWLEDGE_FILE, 'utf-8', (err, kbContent) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ reply: "Server error: Unable to read knowledge base." }));
                        return;
                    }
                    
                    const kb = JSON.parse(kbContent);
                    let reply = "";
                    
                    // Simple search matcher
                    for (const entry of kb.knowledge_base) {
                        for (const keyword of entry.keywords) {
                            if (userMessage.includes(keyword.toLowerCase())) {
                                reply = entry.answer;
                                break;
                            }
                        }
                        if (reply) break;
                    }
                    
                    // Fallback response if no keyword matched
                    if (!reply) {
                        reply = "I'm not sure I understand that. You can ask me about: Yudi, CTS (Conversational Token System), NARA, SAM, our neuroscience and brain-native research, or how to work/collaborate with us.";
                    }
                    
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ reply }));
                });
            } catch (parseErr) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ reply: "Bad Request: Invalid JSON body." }));
            }
        });
        return;
    }
    
    // 2. Admin Get Knowledge Base API
    if (pathname === '/api/admin/knowledge' && req.method === 'GET') {
        const secretHeader = req.headers['x-admin-secret'] || parsedUrl.searchParams.get('secret');
        const adminSecret = process.env.CTS_ADMIN_SECRET || 'yudi_admin';
        
        if (secretHeader !== adminSecret) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Unauthorized: Invalid secret." }));
            return;
        }
        
        fs.readFile(KNOWLEDGE_FILE, 'utf-8', (err, kbContent) => {
            if (err) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Server error: Unable to read knowledge base." }));
                return;
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(kbContent);
        });
        return;
    }
    
    // 3. Admin Update Knowledge Base API
    if (pathname === '/api/admin/knowledge' && req.method === 'POST') {
        const secretHeader = req.headers['x-admin-secret'] || parsedUrl.searchParams.get('secret');
        const adminSecret = process.env.CTS_ADMIN_SECRET || 'yudi_admin';
        
        if (secretHeader !== adminSecret) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: "Unauthorized: Invalid secret." }));
            return;
        }
        
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
            try {
                const data = JSON.parse(body);
                if (!data.system_prompt || !Array.isArray(data.knowledge_base)) {
                    res.writeHead(400, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ error: "Bad Request: Missing system_prompt or knowledge_base array." }));
                    return;
                }
                
                fs.writeFile(KNOWLEDGE_FILE, JSON.stringify(data, null, 2), 'utf-8', (err) => {
                    if (err) {
                        res.writeHead(500, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify({ error: "Server error: Unable to save knowledge base." }));
                        return;
                    }
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({ success: true }));
                });
            } catch (parseErr) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ error: "Bad Request: Invalid JSON body." }));
            }
        });
        return;
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
