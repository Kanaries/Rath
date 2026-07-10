#!/usr/bin/env node
import fs from 'node:fs';

const file = 'packages/rath-client/src/components/icons/legacy-map.ts';
const source = fs.readFileSync(file, 'utf8');

const namesBlock = source.match(/export const legacyIconNames = \[([\s\S]*?)\] as const;/);
const mapBlock = source.match(/export const legacyIconMap: Record<LegacyIconName, LucideIcon> = \{([\s\S]*?)\};/);

if (!namesBlock || !mapBlock) {
    console.error(`Unable to find legacyIconNames or legacyIconMap in ${file}`);
    process.exit(1);
}

const names = [...namesBlock[1].matchAll(/'([^']+)'/g)].map(match => match[1]);
const keys = [...mapBlock[1].matchAll(/^\s*([A-Za-z0-9]+):/gm)].map(match => match[1]);

const duplicateNames = names.filter((name, index) => names.indexOf(name) !== index);
const duplicateKeys = keys.filter((key, index) => keys.indexOf(key) !== index);
const missingKeys = names.filter(name => !keys.includes(name));
const extraKeys = keys.filter(key => !names.includes(key));

const result = {
    names: names.length,
    keys: keys.length,
    duplicateNames,
    duplicateKeys,
    missingKeys,
    extraKeys,
};

console.log(JSON.stringify(result, null, 2));

if (duplicateNames.length || duplicateKeys.length || missingKeys.length || extraKeys.length) {
    process.exit(1);
}
