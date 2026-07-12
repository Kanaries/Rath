#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const srcDir = path.join(root, 'packages/rath-client/src')
const full = process.argv.includes('--full')

const stage6Components = ['TooltipHost', 'Callout', 'Modal', 'Dialog', 'DialogFooter', 'Panel', 'Layer']
const stage7Components = [
  'Dropdown',
  'DetailsList',
  'Pivot',
  'PivotItem',
  'ContextualMenu',
  'CommandBar',
  'Nav',
  'Breadcrumb',
  'HoverCard',
  'ColorPicker',
  'SwatchColorPicker',
]
const v9Components = [
  'Button',
  'Card',
  'CardHeader',
  'Caption1',
  'FluentProvider',
  'Menu',
  'MenuItem',
  'MenuList',
  'MenuPopover',
  'MenuTrigger',
  'SplitButton',
  'Tab',
  'TabList',
  'Text',
]
const v9Helpers = ['makeStyles', 'shorthands', 'tokens', 'webLightTheme']

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      return walk(fullPath)
    }
    if (/\.(ts|tsx)$/.test(entry.name)) {
      return [fullPath]
    }
    return []
  })
}

function lineOf(source, index) {
  return source.slice(0, index).split('\n').length
}

function maskComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, ' '))
    .replace(/\/\/.*$/gm, (match) => ' '.repeat(match.length))
}

function createEntry() {
  return {
    jsx: 0,
    importFiles: new Set(),
    usageLocations: [],
  }
}

function countJsx(source, rel, component, entry) {
  for (const match of source.matchAll(new RegExp(`<${component}\\b`, 'g'))) {
    entry.jsx += 1
    entry.usageLocations.push(`${rel}:${lineOf(source, match.index)}`)
  }
}

function parseNamedImports(source, packageName) {
  const imported = new Map()
  const pattern = new RegExp(
    `import\\s+(?:type\\s+)?\\{([^}]*)\\}\\s+from\\s+['"]${packageName.replace('/', '\\/')}['"];?`,
    'g'
  )
  for (const match of source.matchAll(pattern)) {
    for (const rawSpecifier of match[1].split(',')) {
      const specifier = rawSpecifier.trim()
      if (!specifier) {
        continue
      }
      const parts = specifier.split(/\s+as\s+/)
      const importedName = parts[0].trim()
      const localName = (parts[1] ?? parts[0]).trim()
      imported.set(localName, importedName)
    }
  }
  return imported
}

function addPatternLocation(target, source, rel, pattern) {
  for (const match of source.matchAll(pattern)) {
    target.push(`${rel}:${lineOf(source, match.index)}`)
  }
}

function compactComponentMap(map) {
  return Object.fromEntries(
    [...map.entries()].map(([name, entry]) => [
      name,
      {
        jsx: entry.jsx,
        importFiles: entry.importFiles.size,
        usageLocations: entry.usageLocations.length,
      },
    ])
  )
}

function fullComponentMap(map) {
  return Object.fromEntries(
    [...map.entries()].map(([name, entry]) => [
      name,
      {
        jsx: entry.jsx,
        importFiles: [...entry.importFiles].sort(),
        usageLocations: entry.usageLocations,
      },
    ])
  )
}

const stage6 = new Map(stage6Components.map((component) => [component, createEntry()]))
const stage7 = new Map(stage7Components.map((component) => [component, createEntry()]))
const v9 = new Map([...v9Components, ...v9Helpers].map((component) => [component, createEntry()]))
const findings = {
  calloutSelectorTargets: [],
  calloutRefTargets: [],
  panelTypes: [],
  dropdownMultiSelect: [],
  dropdownCustomRender: [],
  dropdownMenuItemType: [],
  detailsListSelection: [],
  detailsListCustomRow: [],
  detailsListMsStyleOverrides: [],
  pivotHeadersOnly: [],
  menuProps: [],
  contextualMenuCustomRender: [],
  commandBarItemArrays: [],
  v9MakeStylesFiles: [],
  v9ThemeEntrypoints: [],
}

for (const file of walk(srcDir)) {
  const rel = path.relative(root, file)
  const source = fs.readFileSync(file, 'utf8')
  const scanSource = maskComments(source)
  const v8Imports = parseNamedImports(scanSource, '@fluentui/react')
  const v9Imports = parseNamedImports(scanSource, '@fluentui/react-components')

  for (const [localName, importedName] of v8Imports.entries()) {
    if (stage6.has(importedName)) {
      const entry = stage6.get(importedName)
      entry.importFiles.add(rel)
      countJsx(scanSource, rel, localName, entry)
    }
    if (stage7.has(importedName)) {
      const entry = stage7.get(importedName)
      entry.importFiles.add(rel)
      countJsx(scanSource, rel, localName, entry)
    }
  }

  for (const [localName, importedName] of v9Imports.entries()) {
    if (v9.has(importedName)) {
      const entry = v9.get(importedName)
      entry.importFiles.add(rel)
      if (v9Components.includes(importedName)) {
        countJsx(scanSource, rel, localName, entry)
      } else if (v9Helpers.includes(importedName)) {
        entry.usageLocations.push(rel)
      }
    }
  }

  addPatternLocation(findings.calloutSelectorTargets, scanSource, rel, /\btarget=\{?`?#\$\{[^}]+}/g)
  addPatternLocation(findings.calloutSelectorTargets, scanSource, rel, /\btarget=\{['"]#['"]\s*\+/g)
  addPatternLocation(findings.calloutRefTargets, scanSource, rel, /\btarget=\{container\}/g)
  addPatternLocation(findings.panelTypes, scanSource, rel, /\bPanelType\.[A-Za-z]+/g)
  addPatternLocation(findings.dropdownMultiSelect, scanSource, rel, /\bmultiSelect\b/g)
  addPatternLocation(findings.dropdownCustomRender, scanSource, rel, /\bonRender(?:Option|Title|CaretDown|Label)\b/g)
  addPatternLocation(findings.dropdownMenuItemType, scanSource, rel, /\bDropdownMenuItemType\b/g)
  const hasDetailsListSelectionImport = [...v8Imports.values()].some((importedName) =>
    ['DetailsList', 'Selection', 'SelectionMode'].includes(importedName)
  )
  if (hasDetailsListSelectionImport) {
    addPatternLocation(
      findings.detailsListSelection,
      scanSource,
      rel,
      /\bnew\s+Selection\b|\bselection=\{|\bSelectionMode\.(?!none\b)[A-Za-z]+/g
    )
  }
  addPatternLocation(findings.detailsListCustomRow, scanSource, rel, /\bonRenderRow\b/g)
  addPatternLocation(
    findings.detailsListMsStyleOverrides,
    scanSource,
    rel,
    /\.ms-DetailsList\b|\.ms-DetailsList-headerWrapper\b/g
  )
  addPatternLocation(findings.pivotHeadersOnly, scanSource, rel, /\bheadersOnly\b/g)
  addPatternLocation(findings.menuProps, scanSource, rel, /\bmenuProps\s*=/g)
  addPatternLocation(
    findings.contextualMenuCustomRender,
    scanSource,
    rel,
    /\bonRenderMenuList\b|IContextualMenuListProps\b|IRenderFunction<IContextualMenuListProps>/g
  )
  addPatternLocation(findings.commandBarItemArrays, scanSource, rel, /\bICommandBarItemProps\b|\bitems=\{[^}]*cmd/g)

  if (/\bmakeStyles\b/.test(scanSource)) {
    findings.v9MakeStylesFiles.push(rel)
  }
  if (rel.endsWith('src/index.tsx') || rel.endsWith('src/theme.ts')) {
    if (/@fluentui\/react-components/.test(scanSource)) {
      findings.v9ThemeEntrypoints.push(rel)
    }
  }
}

const fullResult = {
  stage6: {
    totalJsx: [...stage6.values()].reduce((sum, entry) => sum + entry.jsx, 0),
    byComponent: fullComponentMap(stage6),
  },
  stage7: {
    totalJsx: [...stage7.values()].reduce((sum, entry) => sum + entry.jsx, 0),
    byComponent: fullComponentMap(stage7),
  },
  v9: {
    totalJsx: [...v9Components].reduce((sum, component) => sum + v9.get(component).jsx, 0),
    byComponent: fullComponentMap(v9),
  },
  findings,
}

const summary = {
  stage6: {
    totalJsx: fullResult.stage6.totalJsx,
    byComponent: compactComponentMap(stage6),
  },
  stage7: {
    totalJsx: fullResult.stage7.totalJsx,
    byComponent: compactComponentMap(stage7),
  },
  v9: {
    totalJsx: fullResult.v9.totalJsx,
    byComponent: compactComponentMap(v9),
  },
  findings: Object.fromEntries(
    Object.entries(findings).map(([key, value]) => [key, Array.isArray(value) ? value.length : value])
  ),
}

console.log(JSON.stringify(full ? fullResult : summary, null, 2))
