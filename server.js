const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

function loadEnv() {
    const envPath = path.join(__dirname, '.env');
    if (!fs.existsSync(envPath)) return;
    for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
        const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (match && !process.env[match[1]]) process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
    }
}

loadEnv();
const port = Number(process.env.PORT || 3000);
const geminiKey = process.env.GEMINI_API_KEY;
const portfolioContext = `You are April, the friendly AI guide for Anil Kumar Vijayagiri's portfolio. Answer only questions about this portfolio and Anil's professional profile. Anil is a GenAI Engineer with 5+ years of experience building production AI systems. His focus includes LLM applications, AI agents, RAG, evaluation, Python, FastAPI, vector search, cloud deployment, machine learning, NLP, and computer vision. His portfolio explores a Knowledge Copilot, Multi-agent Workflow Studio, and Visual Quality Intelligence. Keep answers concise, accurate, and professional. If a detail is not in this context, say you do not have that information and suggest contacting Anil at anil.vijayagiri@example.com.`;

function sendJson(response, status, body) {
    response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(body));
}

function serveStatic(request, response) {
    const requestedPath = request.url === '/' ? '/index.html' : request.url.split('?')[0];
    const filePath = path.normalize(path.join(__dirname, requestedPath));
    if (!filePath.startsWith(__dirname) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
        response.writeHead(404);
        response.end('Not found');
        return;
    }
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.jpg': 'image/jpeg', '.png': 'image/png' };
    response.writeHead(200, { 'Content-Type': types[path.extname(filePath)] || 'application/octet-stream' });
    fs.createReadStream(filePath).pipe(response);
}

const server = http.createServer(async (request, response) => {
    if (request.method === 'POST' && request.url === '/api/april') {
        if (!geminiKey) {
            sendJson(response, 503, { error: { message: 'April is not configured. Add GEMINI_API_KEY to .env.' } });
            return;
        }
        let rawBody = '';
        request.on('data', (chunk) => {
            rawBody += chunk;
            if (rawBody.length > 10000) request.destroy();
        });
        request.on('end', async () => {
            try {
                const prompt = JSON.parse(rawBody).prompt?.trim();
                if (!prompt) {
                    sendJson(response, 400, { error: { message: 'A question is required.' } });
                    return;
                }
                const geminiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ contents: [{ parts: [{ text: `${portfolioContext}\n\nUser question: ${prompt}` }] }] })
                });
                const data = await geminiResponse.json();
                sendJson(response, geminiResponse.status, data);
            } catch (error) {
                sendJson(response, 500, { error: { message: error.message || 'April could not answer right now.' } });
            }
        });
        return;
    }
    serveStatic(request, response);
});

server.listen(port, () => console.log(`Portfolio running at http://localhost:${port}`));
