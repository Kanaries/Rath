#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { extname, join, relative, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';

const root = resolve(process.argv[2] ?? 'packages/rath-client/build');

if (!existsSync(root)) {
    console.error(`Build directory does not exist: ${root}`);
    process.exit(1);
}

function walk(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
    });
}

const files = walk(root).map((path) => {
    const bytes = statSync(path).size;
    const extension = extname(path).toLowerCase();
    const compressible = ['.css', '.html', '.js', '.json', '.svg', '.txt'].includes(extension);
    return {
        path: relative(root, path),
        bytes,
        gzipBytes: compressible ? gzipSync(readFileSync(path)).byteLength : null,
    };
});

const indexPath = join(root, 'index.html');
const indexHtml = existsSync(indexPath) ? readFileSync(indexPath, 'utf8') : '';
const scriptUrls = [...indexHtml.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/gi)].map((match) => match[1]);
const stylesheetUrls = [...indexHtml.matchAll(/<link\b[^>]*\brel=["']stylesheet["'][^>]*\bhref=["']([^"']+)["']/gi)].map(
    (match) => match[1]
);

const totalBytes = files.reduce((sum, file) => sum + file.bytes, 0);
const totalGzipBytes = files.reduce((sum, file) => sum + (file.gzipBytes ?? 0), 0);
// CRA/worker-loader emits `name.worker.js`, while Vite emits
// `name.worker-<content-hash>.js`. Keep both visible in the same report.
const workerFiles = files.filter((file) => /(?:^|\/)[^/]+\.worker(?:-[^/]+)?\.js$/.test(file.path));
const javascriptFiles = files.filter((file) => file.path.endsWith('.js'));
const cssFiles = files.filter((file) => file.path.endsWith('.css'));

const largestFiles = [...files]
    .sort((left, right) => right.bytes - left.bytes)
    .slice(0, 20);

console.log(
    JSON.stringify(
        {
            buildDirectory: root,
            generatedAt: new Date().toISOString(),
            totals: {
                files: files.length,
                bytes: totalBytes,
                gzipBytesForCompressibleFiles: totalGzipBytes,
                javascriptFiles: javascriptFiles.length,
                cssFiles: cssFiles.length,
                workerFiles: workerFiles.length,
            },
            entry: {
                scriptUrls,
                stylesheetUrls,
            },
            workers: workerFiles,
            largestFiles,
        },
        null,
        2
    )
);
