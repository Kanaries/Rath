#!/usr/bin/env node

import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';

const root = resolve(process.env.RATH_BUILD_DIR ?? 'packages/rath-client/build');
const port = Number(process.env.RATH_BUILD_PORT ?? 4173);

const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.ico': 'image/x-icon',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.ttf': 'font/ttf',
    '.txt': 'text/plain; charset=utf-8',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
};

function safeFile(relativePath) {
    const candidate = normalize(join(root, relativePath));
    if (candidate !== root && !candidate.startsWith(`${root}${sep}`)) return null;
    return existsSync(candidate) && statSync(candidate).isFile() ? candidate : null;
}

function resolveRequest(pathname) {
    const decoded = decodeURIComponent(pathname).replace(/^\/+/, '');
    const direct = safeFile(decoded);
    if (direct) return direct;

    const segments = decoded.split('/');
    if (segments.length > 1) {
        const withoutBasePrefix = safeFile(segments.slice(1).join('/'));
        if (withoutBasePrefix) return withoutBasePrefix;
    }

    return extname(decoded) ? null : safeFile('index.html');
}

if (!existsSync(join(root, 'index.html'))) {
    console.error(`Frontend build is missing index.html: ${root}`);
    process.exit(1);
}

const server = createServer((request, response) => {
    const url = new URL(request.url ?? '/', `http://${request.headers.host ?? '127.0.0.1'}`);
    const file = resolveRequest(url.pathname);

    if (!file) {
        response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        response.end('Not found');
        return;
    }

    response.writeHead(200, {
        'cache-control': 'no-store',
        'content-type': contentTypes[extname(file).toLowerCase()] ?? 'application/octet-stream',
    });
    createReadStream(file).pipe(response);
});

server.listen(port, '127.0.0.1', () => {
    console.log(`Serving ${root} at http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
    process.on(signal, () => server.close(() => process.exit(0)));
}
