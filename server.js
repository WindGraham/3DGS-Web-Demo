const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 8080;
const MODEL_MAP = {
    train: {
        title: 'Train 30k 全量',
        path: fs.existsSync(path.join(__dirname, 'models', 'train.ply'))
            ? path.join(__dirname, 'models', 'train.ply')
            : '/home/graham/Science/3DGS/02_复现代码/3DGS_Project/output/train/point_cloud/iteration_30000/point_cloud.ply'
    },
    train7k: {
        title: 'Train 7k 快速版',
        path: '/home/graham/Science/3DGS/02_复现代码/3DGS_Project/output/train/point_cloud/iteration_7000/point_cloud.ply'
    },
    sh0: {
        title: 'Train SH=0 消融',
        path: '/home/graham/Science/3DGS/03_实验结果/2026-03-22_最终复现交付/01_解压结果/导出结果目录/ablations_train_eval_clean/sh_degree_0_model/point_cloud/iteration_30000/point_cloud.ply'
    },
    isotropic: {
        title: 'Train Isotropic 消融',
        path: '/home/graham/Science/3DGS/03_实验结果/2026-03-22_最终复现交付/01_解压结果/导出结果目录/ablations_train_eval_clean/isotropic_model/point_cloud/iteration_30000/point_cloud.ply'
    },
    trainEval: {
        title: 'Train Eval 30k',
        path: '/home/graham/Science/3DGS/03_实验结果/2026-03-22_最终复现交付/01_解压结果/导出结果目录/train_eval/point_cloud/iteration_30000/point_cloud.ply'
    }
};
const SCREENSHOT_DIR = path.join(__dirname, 'screenshots');

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, HEAD, POST, OPTIONS');

    if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
    }

    if (req.method === 'POST' && pathname === '/api/screenshot') {
        saveScreenshot(req, res);
        return;
    }

    if (req.method === 'POST' && pathname === '/api/delete-screenshot') {
        deleteScreenshot(req, res);
        return;
    }

    if (pathname === '/api/models') {
        const models = Object.entries(MODEL_MAP).map(([id, model]) => {
            let size = 0;
            try {
                size = fs.statSync(model.path).size;
            } catch {
                size = 0;
            }
            return { id, title: model.title, size };
        });
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ ok: true, models }));
        return;
    }

    const modelMatch = /^\/models\/([a-zA-Z0-9_-]+)\.ply$/.exec(pathname);
    if (modelMatch) {
        const model = MODEL_MAP[modelMatch[1]] || MODEL_MAP.train;
        serveFile(res, model.path, 'application/octet-stream', true);
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

function saveScreenshot(req, res) {
    let body = '';
    const maxBytes = 50 * 1024 * 1024;

    req.on('data', (chunk) => {
        body += chunk;
        if (body.length > maxBytes) {
            res.writeHead(413, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: 'Screenshot payload too large' }));
            req.destroy();
        }
    });

    req.on('end', () => {
        try {
            const payload = JSON.parse(body);
            const match = /^data:image\/png;base64,(.+)$/.exec(payload.image || '');
            if (!match) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Invalid PNG data URL' }));
                return;
            }

            fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const hint = String(payload.filenameHint || 'capture')
                .replace(/[\\/:*?"<>|]/g, '')
                .replace(/\s+/g, '_')
                .slice(0, 64);
            const filename = `3dgs_${hint}_${timestamp}.png`;
            const filePath = path.join(SCREENSHOT_DIR, filename);
            fs.writeFileSync(filePath, Buffer.from(match[1], 'base64'));

            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                ok: true,
                file: path.relative(__dirname, filePath)
            }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
        }
    });
}

function deleteScreenshot(req, res) {
    let body = '';
    req.on('data', (chunk) => {
        body += chunk;
    });

    req.on('end', () => {
        try {
            const payload = JSON.parse(body || '{}');
            const file = String(payload.file || '').replace(/\\/g, '/');
            const base = path.basename(file);
            if (!base || !base.endsWith('.png')) {
                res.writeHead(400, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ ok: false, error: 'Invalid filename' }));
                return;
            }
            const filePath = path.join(SCREENSHOT_DIR, base);
            if (filePath.startsWith(SCREENSHOT_DIR) && fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: true }));
        } catch (err) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ ok: false, error: err.message }));
        }
    });
}

server.listen(PORT, '0.0.0.0', () => {
    console.log(`3DGS Web Demo 服务器已启动`);
    console.log(`本地访问: http://localhost:${PORT}`);
    console.log(`网络访问: http://0.0.0.0:${PORT}`);
    console.log(`模型文件: ${MODEL_MAP.train.path}`);
});
