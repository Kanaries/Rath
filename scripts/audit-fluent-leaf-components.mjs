#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const srcDir = path.join(root, 'packages/rath-client/src');

const stage5Components = [
    'PrimaryButton',
    'DefaultButton',
    'ActionButton',
    'CommandButton',
    'CommandBarButton',
    'IconButton',
    'TextField',
    'Toggle',
    'Checkbox',
    'ChoiceGroup',
    'Slider',
    'SpinButton',
    'Spinner',
    'ProgressIndicator',
    'Label',
    'Separator',
    'Shimmer',
    'MessageBar',
    'MessageBarButton',
    'SearchBox',
    'Text',
    'Stack',
];

const deferredComponents = [
    'Dropdown',
    'DetailsList',
    'Modal',
    'Dialog',
    'DialogFooter',
    'Panel',
    'Callout',
    'TooltipHost',
    'ContextualMenu',
    'CommandBar',
    'Nav',
    'Pivot',
    'PivotItem',
    'Layer',
    'Breadcrumb',
    'HoverCard',
    'ColorPicker',
    'SwatchColorPicker',
];

const batchOrder = [
    ['components', 'packages/rath-client/src/components/'],
    ['pages/dataSource', 'packages/rath-client/src/pages/dataSource/'],
    ['pages/dataConnection', 'packages/rath-client/src/pages/dataConnection/'],
    ['pages/megaAutomation', 'packages/rath-client/src/pages/megaAutomation/'],
    ['pages/semiAutomation', 'packages/rath-client/src/pages/semiAutomation/'],
    ['pages/causal', 'packages/rath-client/src/pages/causal/'],
    ['pages/dashboard', 'packages/rath-client/src/pages/dashboard/'],
    ['pages/painter', 'packages/rath-client/src/pages/painter/'],
    ['pages/collection', 'packages/rath-client/src/pages/collection/'],
    ['pages/loginInfo', 'packages/rath-client/src/pages/loginInfo/'],
    ['other', ''],
];

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

function getBatch(relPath) {
    const found = batchOrder.find(([name, prefix]) => name !== 'other' && relPath.startsWith(prefix));
    return found?.[0] ?? 'other';
}

function createCountEntry() {
    return {
        jsx: 0,
        importFiles: new Set(),
        usageFiles: new Set(),
    };
}

function serializeComponentCounts(map) {
    return Object.fromEntries(
        [...map.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([component, value]) => [
                component,
                {
                    jsx: value.jsx,
                    importFiles: value.importFiles.size,
                    usageFiles: [...value.usageFiles].sort(),
                },
            ])
    );
}

function serializeBatchCounts(map) {
    return Object.fromEntries(
        batchOrder.map(([batch]) => {
            const value = map.get(batch) ?? { jsx: 0, files: new Set() };
            return [
                batch,
                {
                    jsx: value.jsx,
                    files: [...value.files].sort(),
                },
            ];
        })
    );
}

function compactComponentCounts(serializedCounts) {
    return Object.fromEntries(
        Object.entries(serializedCounts).map(([component, value]) => [
            component,
            {
                jsx: value.jsx,
                importFiles: value.importFiles,
                usageFiles: value.usageFiles.length,
            },
        ])
    );
}

function compactBatchCounts(serializedCounts) {
    return Object.fromEntries(
        Object.entries(serializedCounts).map(([batch, value]) => [
            batch,
            {
                jsx: value.jsx,
                files: value.files.length,
            },
        ])
    );
}

function addBatchUsage(map, relPath, count) {
    const batch = getBatch(relPath);
    if (!map.has(batch)) {
        map.set(batch, { jsx: 0, files: new Set() });
    }
    const value = map.get(batch);
    value.jsx += count;
    if (count > 0) {
        value.files.add(relPath);
    }
}

const stage5Counts = new Map(stage5Components.map(name => [name, createCountEntry()]));
const deferredCounts = new Map(deferredComponents.map(name => [name, createCountEntry()]));
const stage5ByBatch = new Map();
const deferredByBatch = new Map();
const fluentImportFiles = new Set();
const menuPropsFiles = new Set();
const menuPropsCallsites = [];
const stackItemUsageFiles = new Set();
let stackItemUsages = 0;

for (const file of walk(srcDir)) {
    const rel = path.relative(root, file);
    const source = fs.readFileSync(file, 'utf8');
    const importMatches = [...source.matchAll(/import\s+(?:type\s+)?\{([^}]*)\}\s+from\s+['"]@fluentui\/react['"];?/g)];
    if (!importMatches.length) {
        continue;
    }

    fluentImportFiles.add(rel);
    const importedNames = new Set();
    for (const match of importMatches) {
        for (const rawSpecifier of match[1].split(',')) {
            const specifier = rawSpecifier.trim();
            if (!specifier) {
                continue;
            }
            const localName = specifier.split(/\s+as\s+/).pop()?.trim();
            if (localName) {
                importedNames.add(localName);
            }
        }
    }

    for (const component of stage5Components) {
        const entry = stage5Counts.get(component);
        const isFluentComponent = importedNames.has(component);
        if (isFluentComponent) {
            entry.importFiles.add(rel);
        } else {
            continue;
        }
        const matches = [...source.matchAll(new RegExp(`<${component}\\b`, 'g'))];
        if (matches.length) {
            entry.jsx += matches.length;
            entry.usageFiles.add(rel);
            addBatchUsage(stage5ByBatch, rel, matches.length);
        }
    }

    for (const component of deferredComponents) {
        const entry = deferredCounts.get(component);
        const isFluentComponent = importedNames.has(component);
        if (isFluentComponent) {
            entry.importFiles.add(rel);
        } else {
            continue;
        }
        const matches = [...source.matchAll(new RegExp(`<${component}\\b`, 'g'))];
        if (matches.length) {
            entry.jsx += matches.length;
            entry.usageFiles.add(rel);
            addBatchUsage(deferredByBatch, rel, matches.length);
        }
    }

    if (importedNames.has('Stack')) {
        const stackItemMatches = [...source.matchAll(/<Stack\.Item\b/g)];
        if (stackItemMatches.length) {
            stackItemUsages += stackItemMatches.length;
            stackItemUsageFiles.add(rel);
            addBatchUsage(stage5ByBatch, rel, stackItemMatches.length);
        }
    }

    for (const match of source.matchAll(/\bmenuProps\s*=/g)) {
        menuPropsFiles.add(rel);
        const line = source.slice(0, match.index).split('\n').length;
        menuPropsCallsites.push(`${rel}:${line}`);
    }
}

const result = {
    fluentReactImportFiles: fluentImportFiles.size,
    stage5: {
        totalJsx:
            [...stage5Counts.values()].reduce((sum, value) => sum + value.jsx, 0) +
            stackItemUsages,
        stackItemUsages,
        stackItemUsageFiles: [...stackItemUsageFiles].sort(),
        byComponent: serializeComponentCounts(stage5Counts),
        byBatch: serializeBatchCounts(stage5ByBatch),
        menuPropsDeferred: {
            callsites: menuPropsCallsites.length,
            files: [...menuPropsFiles].sort(),
            locations: menuPropsCallsites,
        },
    },
    deferred: {
        totalJsx: [...deferredCounts.values()].reduce((sum, value) => sum + value.jsx, 0),
        byComponent: serializeComponentCounts(deferredCounts),
        byBatch: serializeBatchCounts(deferredByBatch),
    },
};

if (process.argv.includes('--full')) {
    console.log(JSON.stringify(result, null, 2));
} else {
    console.log(JSON.stringify({
        fluentReactImportFiles: result.fluentReactImportFiles,
        stage5: {
            totalJsx: result.stage5.totalJsx,
            stackItemUsages: result.stage5.stackItemUsages,
            byComponent: compactComponentCounts(result.stage5.byComponent),
            byBatch: compactBatchCounts(result.stage5.byBatch),
            menuPropsDeferred: result.stage5.menuPropsDeferred,
        },
        deferred: {
            totalJsx: result.deferred.totalJsx,
            byComponent: compactComponentCounts(result.deferred.byComponent),
            byBatch: compactBatchCounts(result.deferred.byBatch),
        },
    }, null, 2));
}
