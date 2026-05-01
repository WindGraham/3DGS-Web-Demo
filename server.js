const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const MODEL_PATH = fs.existsSync(path.join(__dirname, 'models', 'train.ply'))
    ? path.join(__dirname, 'models', 'train.ply')
    : '/home/graham/Science/3DGS/02_复现代码/3DGS_Project/output/train/point_cloud/iteration_30000/point_cloud.ply';

const mimeTypes = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.ply': 'application/octet-stream'
};

function getMimeType(filePath) {
    return mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

const server = http.createServer((req, res) => {
    const parsedUrl = url.parse(req.url, true);
    let pathname = parsedUrl.pathname;

    // CORS headers for SharedArrayBuffer support (even if disabled, good practice)
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    // Route /models/train.ply to the actual file
    if (pathname === '/models/train.ply') {
        serveFile(res, MODEL_PATH, 'application/octet-stream', true);
        return;
    }

    // Default to serving files from current directory
    if (pathname === '/') pathname = '/index.html';
    const safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
    const filePath = path.join(__dirname, safePath);

    // Security: ensure file is within __dirname
    if (!filePath.startsWith(__dirname)) {
        res.writeHead(403, { 'Content-Type': 'text/plain' });
        res.end('Forbidden');
        return;
    }

    serveFile(res, filePath, getMimeType(filePath), false);
});

function serveFile(res, filePath, contentType, isModel) {
    fs.stat(filePath, (err, stats) => {
        if (err || !stats.isFile()) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('Not Found');
            return;
        }

        const totalSize = stats.size;
        const range = res.req.headers.range;

        if (range) {
            const parts = range.replace(/bytes=/, '').split('-');
            const start = parseInt(parts[0], 10);
            const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;
            const chunkSize = end - start + 1;

            res.writeHead(206, {
                'Content-Type': contentType,
                'Content-Length': chunkSize,
                'Content-Range': `bytes ${start}-${end}/${totalSize}`,
                'Accept-Ranges': 'bytes'
            });
            fs.createReadStream(filePath, { start, end }).pipe(res);
        } else {
            res.writeHead(200, {
                'Content-Type': contentType,
                'Content-Length': totalSize,
                'Accept-Ranges': 'bytes'
            });
            fs.createReadStream(filePath).pipe(res);
        }
    });
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`3DGS Web Demo 服务器已启动`);
    console.log(`本地访问: http://localhost:${PORT}`);
    console.log(`网络访问: http://0.0.0.0:${PORT}`);
    console.log(`模型文件: ${MODEL_PATH}`);
});
