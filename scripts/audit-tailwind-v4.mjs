#!/usr/bin/env node

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { extname, join, resolve } from 'node:path';

const root = resolve('packages/rath-client');
const sourceRoot = join(root, 'src');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const componentsJson = JSON.parse(readFileSync(join(root, 'components.json'), 'utf8'));
const directDependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
const failures = [];

function walk(directory) {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const path = join(directory, entry.name);
        return entry.isDirectory() ? walk(path) : [path];
    });
}

function requireVersion(name, major) {
    const version = directDependencies[name];
    if (!version || !version.startsWith(`${major}.`)) {
        failures.push(`${name} must be pinned to major ${major}; received ${version ?? 'missing'}`);
    }
}

requireVersion('tailwindcss', 4);
requireVersion('@tailwindcss/vite', 4);
requireVersion('tailwind-merge', 3);
requireVersion('tw-animate-css', 1);

for (const removedDependency of ['tailwindcss-animate', 'autoprefixer', 'postcss']) {
    if (directDependencies[removedDependency]) failures.push(`${removedDependency} must not remain a direct dependency`);
}

for (const removedConfig of ['tailwind.config.js', 'postcss.config.cjs']) {
    if (existsSync(join(root, removedConfig))) failures.push(`${removedConfig} must not remain after the CSS-first migration`);
}

if (componentsJson.tailwind?.config !== '') failures.push('components.json must leave tailwind.config empty for Tailwind 4');
if (componentsJson.tailwind?.css !== 'src/index.css') failures.push('components.json must point to src/index.css');

const sourcePatterns = [
    ['legacy @tailwind directive', /@tailwind\s+(?:base|components|utilities)/],
    ['legacy hsl(var()) token wrapper', /hsl\(var\(--/],
    ['removed opacity utility', /\b(?:bg|text|border|divide|ring|placeholder)-opacity-\d+\b/],
    ['removed flex utility', /\bflex-(?:shrink|grow)-\d+\b/],
    ['removed overflow utility', /\boverflow-ellipsis\b/],
    ['Tailwind 3 outline utility', /\boutline-none\b/],
];

for (const path of walk(sourceRoot)) {
    if (!['.css', '.js', '.jsx', '.ts', '.tsx'].includes(extname(path))) continue;
    const content = readFileSync(path, 'utf8');
    for (const [label, pattern] of sourcePatterns) {
        if (pattern.test(content)) failures.push(`${label}: ${path.slice(root.length + 1)}`);
    }
}

if (failures.length > 0) {
    console.error(`Tailwind 4 audit failed:\n- ${failures.join('\n- ')}`);
    process.exit(1);
}

console.log('Tailwind 4 audit passed.');
