#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'packages/rath-client/src');
const legacyMapFile = path.join(srcDir, 'components/icons/legacy-map.ts');

function walk(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return walk(fullPath);
        }
        if (/\.(ts|tsx)$/.test(entry.name)) {
            return [fullPath];
        }
        return [];
    });
}

function readLegacyNames() {
    const source = fs.readFileSync(legacyMapFile, 'utf8');
    const namesBlock = source.match(/export const legacyIconNames = \[([\s\S]*?)\] as const;/);
    if (!namesBlock) {
        throw new Error(`Unable to read legacyIconNames from ${legacyMapFile}`);
    }
    return new Set([...namesBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]));
}

function addUnique(map, key, value) {
    if (!map.has(key)) {
        map.set(key, new Set());
    }
    map.get(key).add(value);
}

const legacyNames = readLegacyNames();
const knownNonIconExpressionLiterals = new Set([
    // Pagination item type compared inside iconName expressions, not an icon name.
    'previous',
]);
const files = walk(srcDir);
const literalNames = new Map();
const expressionNames = new Map();
const ignoredExpressionNames = new Map();
const unmappedLiteralNames = new Map();
const unmappedExpressionNames = new Map();
const dynamicIconNameExpressions = [];
const standaloneIconFiles = new Set();
const fluentIconImportFiles = new Set();
const iconPropsFiles = new Set();
const registerIconsFiles = new Set();
const bareMsIconFiles = new Set();

let standaloneIconElements = 0;
let iconPropsUsages = 0;
let literalIconNameUsages = 0;
let expressionIconNameUsages = 0;
let registerIconsUsages = 0;
let bareMsIconUsages = 0;

for (const file of files) {
    const rel = path.relative(root, file);
    const source = fs.readFileSync(file, 'utf8');
    const hasFluentIconImport = /import\s*\{[^}]*\bIcon\b[^}]*\}\s*from\s*['"]@fluentui\/react['"]/.test(source);

    if (hasFluentIconImport) {
        fluentIconImportFiles.add(rel);
    }

    if (/\bregisterIcons\s*\(/.test(source)) {
        registerIconsFiles.add(rel);
        registerIconsUsages += [...source.matchAll(/\bregisterIcons\s*\(/g)].length;
    }

    if (/\bms-Icon\b/.test(source)) {
        bareMsIconFiles.add(rel);
        bareMsIconUsages += [...source.matchAll(/\bms-Icon\b/g)].length;
    }

    if (/\biconProps\b/.test(source)) {
        iconPropsFiles.add(rel);
        iconPropsUsages += [...source.matchAll(/\biconProps\b/g)].length;
    }

    if (hasFluentIconImport) {
        const iconElementMatches = [...source.matchAll(/<Icon\b/g)];
        if (iconElementMatches.length) {
            standaloneIconFiles.add(rel);
            standaloneIconElements += iconElementMatches.length;
        }
    }

    const literalPatterns = [
        /\biconName\s*=\s*["']([^"']+)["']/g,
        /\biconName\s*=\s*\{\s*["']([^"']+)["']\s*\}/g,
        /\biconName\s*:\s*["']([^"']+)["']/g,
    ];

    for (const pattern of literalPatterns) {
        for (const match of source.matchAll(pattern)) {
            const name = match[1];
            literalIconNameUsages += 1;
            addUnique(literalNames, name, rel);
            if (!legacyNames.has(name)) {
                addUnique(unmappedLiteralNames, name, rel);
            }
        }
    }

    for (const match of source.matchAll(/\biconName\s*=\s*\{([^}]+)\}/g)) {
        const expression = match[1].trim();
        if (/^["'][^"']+["']$/.test(expression)) {
            continue;
        }
        expressionIconNameUsages += 1;
        dynamicIconNameExpressions.push({ file: rel, expression });
        for (const nameMatch of expression.matchAll(/["']([A-Za-z0-9]+)["']/g)) {
            const name = nameMatch[1];
            if (knownNonIconExpressionLiterals.has(name)) {
                addUnique(ignoredExpressionNames, name, rel);
                continue;
            }
            addUnique(expressionNames, name, rel);
            if (!legacyNames.has(name)) {
                addUnique(unmappedExpressionNames, name, rel);
            }
        }
    }
}

function serializeNameMap(map) {
    return Object.fromEntries(
        [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, fileSet]) => [name, [...fileSet].sort()])
    );
}

const result = {
    filesScanned: files.length,
    legacyNames: legacyNames.size,
    fluentIconImportFiles: fluentIconImportFiles.size,
    standaloneIconElements,
    standaloneIconFiles: [...standaloneIconFiles].sort(),
    iconPropsUsages,
    iconPropsFiles: iconPropsFiles.size,
    registerIconsUsages,
    registerIconsFiles: [...registerIconsFiles].sort(),
    bareMsIconUsages,
    bareMsIconFiles: [...bareMsIconFiles].sort(),
    literalIconNameUsages,
    literalIconNames: literalNames.size,
    unmappedLiteralNames: serializeNameMap(unmappedLiteralNames),
    expressionIconNameUsages,
    expressionLiteralNames: serializeNameMap(expressionNames),
    ignoredExpressionLiteralNames: serializeNameMap(ignoredExpressionNames),
    unmappedExpressionLiteralNames: serializeNameMap(unmappedExpressionNames),
    dynamicIconNameExpressions,
};

console.log(JSON.stringify(result, null, 2));

if (unmappedLiteralNames.size) {
    process.exit(1);
}
