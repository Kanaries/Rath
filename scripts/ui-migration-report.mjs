#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const root = process.cwd();

function runJson(script, args = []) {
    const result = spawnSync(process.execPath, [path.join(root, script), ...args], {
        cwd: root,
        encoding: 'utf8',
    });

    if (result.status !== 0) {
        const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
        throw new Error(`${script} failed:\n${output}`);
    }

    return JSON.parse(result.stdout);
}

function runText(command, args = []) {
    const result = spawnSync(command, args, {
        cwd: root,
        encoding: 'utf8',
    });

    if (result.status !== 0) {
        const output = [result.stdout, result.stderr].filter(Boolean).join('\n');
        throw new Error(`${command} ${args.join(' ')} failed:\n${output}`);
    }

    return result.stdout.trim();
}

const iconMap = runJson('scripts/verify-icon-map.mjs');
const iconCalls = runJson('scripts/audit-icon-calls.mjs');
const leaf = runJson('scripts/audit-fluent-leaf-components.mjs');
const complex = runJson('scripts/audit-fluent-complex-components.mjs');
const teardown = runJson('scripts/audit-fluent-teardown.mjs');
const gatesOutput = runText('bash', ['scripts/ui-migration-gates.sh']);

const report = {
    stage4Icons: {
        mapNames: iconMap.names,
        mapKeys: iconMap.keys,
        duplicateNames: iconMap.duplicateNames.length,
        duplicateKeys: iconMap.duplicateKeys.length,
        missingKeys: iconMap.missingKeys.length,
        extraKeys: iconMap.extraKeys.length,
        standaloneIconElements: iconCalls.standaloneIconElements,
        iconPropsUsages: iconCalls.iconPropsUsages,
        registerIconsUsages: iconCalls.registerIconsUsages,
        bareMsIconUsages: iconCalls.bareMsIconUsages,
        unmappedLiteralNames: Object.keys(iconCalls.unmappedLiteralNames).length,
    },
    stage5Leaf: {
        fluentReactImportFiles: leaf.fluentReactImportFiles,
        totalJsx: leaf.stage5.totalJsx,
        stack: leaf.stage5.byComponent.Stack.jsx,
        stackItem: leaf.stage5.stackItemUsages,
        buttons: [
            'PrimaryButton',
            'DefaultButton',
            'ActionButton',
            'CommandButton',
            'CommandBarButton',
            'IconButton',
        ].reduce((sum, name) => sum + leaf.stage5.byComponent[name].jsx, 0),
        textField: leaf.stage5.byComponent.TextField.jsx,
        toggle: leaf.stage5.byComponent.Toggle.jsx,
        choiceGroup: leaf.stage5.byComponent.ChoiceGroup.jsx,
        checkbox: leaf.stage5.byComponent.Checkbox.jsx,
        menuPropsDeferred: leaf.stage5.menuPropsDeferred.callsites,
        byBatch: Object.fromEntries(
            Object.entries(leaf.stage5.byBatch).map(([batch, value]) => [batch, value.jsx])
        ),
    },
    stage6Stage7Complex: {
        stage6OverlayJsx: complex.stage6.totalJsx,
        stage7ComplexJsx: complex.stage7.totalJsx,
        v9Jsx: complex.v9.totalJsx,
        findings: complex.findings,
    },
    stage8Teardown: {
        packageFluentDeps: teardown.packageFluentDeps,
        sourceFluentMatches: teardown.sourceFluentMatches.count,
        publicFontReferences: teardown.publicFontReferences.count,
        iconApiMatches: teardown.iconApiMatches.count,
        msClassMatches: teardown.msClassMatches.count,
        providerMatches: teardown.providerMatches.count,
        lockMatches: teardown.lockMatches.count,
        fabricFontFiles: teardown.fabricFontFiles,
        eslintHasFluentRestriction: teardown.eslintRestriction.hasFluentRestriction,
        preflightCompatBytes: teardown.preflightCompat.bytes,
    },
    gates: Object.fromEntries(
        gatesOutput
            .split('\n')
            .reduce((rows, line, index, lines) => {
                if (line.startsWith('== ') && lines[index + 1]) {
                    rows.push([
                        line.replace(/^==\s*/, '').replace(/\s*==$/, ''),
                        Number(lines[index + 1].trim()),
                    ]);
                }
                return rows;
            }, [])
    ),
};

console.log(JSON.stringify(report, null, 2));
