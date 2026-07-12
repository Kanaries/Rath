import { readFile, readdir } from 'node:fs/promises';
import { join, relative } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import semver from 'semver';

const root = new URL('../', import.meta.url);
const clientRoot = new URL('../packages/rath-client/', import.meta.url);
const clientPackage = JSON.parse(await readFile(new URL('package.json', clientRoot), 'utf8'));
const expectedCandidateVersions = {
    react: '19.2.7',
    'react-dom': '19.2.7',
    'react-is': '19.2.7',
    '@types/react': '19.2.17',
    '@types/react-dom': '19.2.3',
    '@kanaries/graphic-walker': '0.5.2',
    '@vercel/analytics': '2.0.1',
    mobx: '6.16.1',
    'mobx-react-lite': '4.1.1',
    'react-monaco-editor': '0.59.0',
    'monaco-editor': '0.52.2',
    're-resizable': '6.11.2',
    'styled-components': '6.4.3',
    typescript: '5.9.3',
};

const removedApiPatterns = [
    ['ReactDOM.render', /ReactDOM\s*\.\s*render\s*\(/],
    ['ReactDOM.hydrate', /ReactDOM\s*\.\s*hydrate\s*\(/],
    ['ReactDOM.findDOMNode', /(?:ReactDOM\s*\.\s*)?findDOMNode\s*\(/],
    ['ReactDOM.unmountComponentAtNode', /unmountComponentAtNode\s*\(/],
    ['react-dom/test-utils', /from\s+['"]react-dom\/test-utils['"]/],
    ['React.createFactory', /(?:React\s*\.\s*)?createFactory\s*\(/],
];

async function sourceFiles(directory) {
    const result = [];
    for (const entry of await readdir(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) {
            result.push(...(await sourceFiles(path)));
        } else if (/\.[jt]sx?$/.test(entry.name)) {
            result.push(path);
        }
    }
    return result;
}

async function installedManifest(name) {
    const manifestUrl = new URL(`node_modules/${name}/package.json`, root);
    return JSON.parse(await readFile(manifestUrl, 'utf8'));
}

const versionProblems = [];
for (const [name, expected] of Object.entries(expectedCandidateVersions)) {
    const actual = clientPackage.dependencies?.[name] ?? clientPackage.devDependencies?.[name];
    if (actual !== expected) {
        versionProblems.push(`${name}: expected ${expected}, found ${actual ?? 'missing'}`);
    }
}

const apiProblems = [];
for (const path of await sourceFiles(fileURLToPath(new URL('src/', clientRoot)))) {
    const source = await readFile(path, 'utf8');
    for (const [label, pattern] of removedApiPatterns) {
        if (pattern.test(source)) {
            apiProblems.push(`${relative(new URL('.', root).pathname, path)} uses ${label}`);
        }
    }
}

const compatibilityPackages = [
    'mobx-react-lite',
    'react-monaco-editor',
    're-resizable',
    '@kanaries/graphic-walker',
    '@kanaries/react-beautiful-dnd',
    '@headlessui/react',
    'react-leaflet',
    'react-resizable-panels',
    'react-resize-detector',
];
const compatibility = [];
for (const name of compatibilityPackages) {
    const manifest = await installedManifest(name);
    compatibility.push({
        name,
        version: manifest.version,
        reactPeer: manifest.peerDependencies?.react ?? '(none)',
        reactDomPeer: manifest.peerDependencies?.['react-dom'] ?? '(none)',
    });
}

async function installedReactPeerDeclarations(nodeModulesDirectory, seen = new Set()) {
    const declarations = [];
    for (const entry of await readdir(nodeModulesDirectory, { withFileTypes: true })) {
        if ((!entry.isDirectory() && !entry.isSymbolicLink()) || entry.name === '.bin') {
            continue;
        }
        const entryPath = join(nodeModulesDirectory, entry.name);
        if (entry.name.startsWith('@')) {
            declarations.push(...(await installedReactPeerDeclarations(entryPath, seen)));
            continue;
        }
        const manifestPath = join(entryPath, 'package.json');
        try {
            const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
            const identity = `${manifest.name}@${manifest.version}`;
            if (!seen.has(identity)) {
                seen.add(identity);
                const reactPeer = manifest.peerDependencies?.react;
                if (reactPeer) {
                    declarations.push({ name: manifest.name, version: manifest.version, reactPeer });
                }
            }
        } catch {
            // A node_modules entry without a readable package manifest is not an installed package.
        }
        const nestedNodeModules = join(entryPath, 'node_modules');
        try {
            declarations.push(...(await installedReactPeerDeclarations(nestedNodeModules, seen)));
        } catch {
            // Most hoisted packages do not have a nested node_modules directory.
        }
    }
    return declarations;
}

const installedReactPeers = await installedReactPeerDeclarations(fileURLToPath(new URL('node_modules/', root)));
const incompatiblePeerDeclarations = installedReactPeers.filter(({ reactPeer }) => !semver.satisfies(expectedCandidateVersions.react, reactPeer, { includePrerelease: true }));
const candidatePassed = versionProblems.length === 0 && apiProblems.length === 0;
const dependencyClean = incompatiblePeerDeclarations.length === 0;

console.log('React 19 readiness audit');
console.log(`- React 19 candidate versions: ${candidatePassed ? 'PASS' : 'FAIL'}`);
console.log(`- Removed React API scan: ${apiProblems.length === 0 ? 'PASS' : 'FAIL'}`);
console.table(compatibility);
console.log(`- React 19 compatibility probe: ${candidatePassed ? 'PASS' : 'FAIL'}`);
console.log(`- Installed React peer scan: ${installedReactPeers.length} declarations checked`);
console.log(`- Final dependency-clean gate: ${dependencyClean ? 'PASS' : 'FAIL'}`);
if (!dependencyClean) {
    console.log(`  React 19-incompatible peer declarations: ${incompatiblePeerDeclarations.map(({ name, version, reactPeer }) => `${name}@${version} (${reactPeer})`).join('; ')}`);
}
console.log('  Canary evidence: pocs/react19-graphic-walker/README.md');

for (const problem of [...versionProblems, ...apiProblems]) {
    console.error(`ERROR: ${problem}`);
}

if (!candidatePassed || (process.argv.includes('--react19-gate') && !dependencyClean)) {
    process.exitCode = 1;
}
