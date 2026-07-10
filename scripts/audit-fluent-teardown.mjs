#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const full = process.argv.includes('--full');
const strict = process.argv.includes('--strict');

const srcDir = path.join(root, 'packages/rath-client/src');
const publicDir = path.join(root, 'packages/rath-client/public');
const packageFile = path.join(root, 'packages/rath-client/package.json');
const lockFile = path.join(root, 'yarn.lock');
const eslintFiles = [
    '.eslintrc',
    '.eslintrc.json',
    '.eslintrc.js',
    'packages/rath-client/.eslintrc',
    'packages/rath-client/.eslintrc.json',
    'packages/rath-client/.eslintrc.js',
].map(file => path.join(root, file));

function walk(dir, predicate = () => true) {
    if (!fs.existsSync(dir)) {
        return [];
    }
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(entry => {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            return walk(fullPath, predicate);
        }
        return predicate(fullPath) ? [fullPath] : [];
    });
}

function collectMatches(files, pattern) {
    const matches = [];
    for (const file of files) {
        const source = fs.readFileSync(file, 'utf8');
        const lines = source.split('\n');
        for (const match of source.matchAll(pattern)) {
            const line = source.slice(0, match.index).split('\n').length;
            matches.push({
                file: path.relative(root, file),
                line,
                lineText: lines[line - 1],
                match: match[0],
            });
        }
    }
    return matches;
}

function compact(matches) {
    const files = new Set(matches.map(match => match.file));
    return { count: matches.length, files: files.size };
}

function findPackageFluentDeps() {
    const pkg = JSON.parse(fs.readFileSync(packageFile, 'utf8'));
    const sections = ['dependencies', 'devDependencies', 'peerDependencies', 'optionalDependencies'];
    const deps = [];
    for (const section of sections) {
        const values = pkg[section] ?? {};
        for (const [name, version] of Object.entries(values)) {
            if (/^@fluentui\//.test(name) || name === 'office-ui-fabric-core') {
                deps.push({ section, name, version });
            }
        }
    }
    return deps;
}

function findLockMatches() {
    if (!fs.existsSync(lockFile)) {
        return [];
    }
    const source = fs.readFileSync(lockFile, 'utf8');
    const lines = source.split('\n');
    return lines.flatMap((line, index) => {
        if (/@fluentui\/|office-ui-fabric-core/.test(line) && !/@fluentui\/react-icons/.test(line)) {
            return [{ file: 'yarn.lock', line: index + 1, match: line.trim() }];
        }
        return [];
    });
}

function findEslintRestriction() {
    const existing = eslintFiles.find(file => fs.existsSync(file));
    if (!existing) {
        return { file: null, hasFluentRestriction: false };
    }
    const source = fs.readFileSync(existing, 'utf8');
    return {
        file: path.relative(root, existing),
        hasFluentRestriction: /no-restricted-imports/.test(source) && /@fluentui\/\*|@fluentui\/|office-ui-fabric-core/.test(source),
    };
}

const srcFiles = walk(srcDir, file => /\.(ts|tsx|css|scss|less)$/.test(file));
const packageFiles = [packageFile].filter(file => fs.existsSync(file));
const publicFiles = walk(publicDir, file => /\.(md|css|html|js|json|woff)$/.test(file));

const packageFluentDeps = findPackageFluentDeps();
const sourceFluentMatches = collectMatches([...srcFiles, ...packageFiles], /@fluentui\/|office-ui-fabric-core/g);
const publicFontReferences = collectMatches(publicFiles, /fabric-icons|@fluentui\/font-icons-mdl2|initializeIcons/g);
const iconApiMatches = collectMatches(srcFiles, /\biconName\s*[=:]|\biconProps\s*[=:]|\bregisterIcons\b|\binitializeIcons\b/g);
const msClassMatches = collectMatches(srcFiles, /\bms-[A-Za-z][A-Za-z0-9-]*/g).filter((match) => {
    return !/application\/vnd\.ms-excel|-ms-/.test(match.lineText);
});
const providerMatches = collectMatches(srcFiles, /\bThemeProvider\b|\bFluentProvider\b|office-ui-fabric-core\/dist\/css\/fabric\.css|initializeIcons\('/g);
const lockMatches = findLockMatches();
const fontFiles = walk(path.join(publicDir, 'fonts'), file => /fabric-icons-.*\.woff$/.test(path.basename(file)));
const eslintRestriction = findEslintRestriction();
const preflightCompatFile = path.join(srcDir, 'styles/preflight-compat.css');
const preflightCompat = {
    exists: fs.existsSync(preflightCompatFile),
    bytes: fs.existsSync(preflightCompatFile) ? fs.statSync(preflightCompatFile).size : 0,
};

const fullResult = {
    packageFluentDeps,
    sourceFluentMatches,
    publicFontReferences,
    iconApiMatches,
    msClassMatches,
    providerMatches,
    lockMatches,
    fabricFontFiles: fontFiles.map(file => path.relative(root, file)).sort(),
    eslintRestriction,
    preflightCompat,
};

const summary = {
    packageFluentDeps: packageFluentDeps.length,
    sourceFluentMatches: compact(sourceFluentMatches),
    publicFontReferences: compact(publicFontReferences),
    iconApiMatches: compact(iconApiMatches),
    msClassMatches: compact(msClassMatches),
    providerMatches: compact(providerMatches),
    lockMatches: compact(lockMatches),
    fabricFontFiles: fontFiles.length,
    eslintRestriction,
    preflightCompat,
};

console.log(JSON.stringify(full ? fullResult : summary, null, 2));

const failures = [
    packageFluentDeps.length,
    sourceFluentMatches.length,
    publicFontReferences.length,
    iconApiMatches.length,
    msClassMatches.length,
    providerMatches.length,
    lockMatches.length,
    fontFiles.length,
    eslintRestriction.hasFluentRestriction ? 0 : 1,
].reduce((sum, count) => sum + count, 0);

if (strict && failures > 0) {
    process.exit(1);
}
