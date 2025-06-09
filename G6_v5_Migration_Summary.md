# G6 v4 to v5 Migration Summary

## Overview
This document summarizes the migration of the Rath client from antv/G6 v4 to v5. The migration affects primarily the causal analysis feature under `src/pages/causal/`.

## Package Version
- **Before**: `@antv/g6: ^4.8.4`
- **After**: `@antv/g6: ^5.0.48`

## Key Changes Made

### 1. Data Structure Changes

#### Node Data Format
**v4 Format:**
```typescript
{
  id: 'node1',
  label: 'Node Label',
  size: 20,
  fill: 'red'
}
```

**v5 Format:**
```typescript
{
  id: 'node1',
  data: {
    description: 'Node Label'
  },
  style: {
    size: 20,
    fill: 'red'
  }
}
```

#### Edge Data Format
**v4 Format:**
```typescript
{
  source: 'node1',
  target: 'node2',
  label: 'Edge Label',
  startArrow: {
    path: 'M 8,0 L 19,5 L 19,-5 Z',
    fill: '#F6BD16'
  }
}
```

**v5 Format:**
```typescript
{
  source: 'node1',
  target: 'node2',
  data: {
    label: 'Edge Label'
  },
  style: {
    startArrow: {
      d: 'M 8,0 L 19,5 L 19,-5 Z',
      fill: '#F6BD16'
    }
  }
}
```

### 2. Configuration Changes

#### Graph Options
**v4 Configuration:**
```typescript
{
  modes: {
    explore: ['drag-canvas', 'drag-node'],
    edit: ['drag-canvas', 'create-edge']
  },
  defaultNode: {
    size: 20,
    style: { lineWidth: 1 }
  },
  nodeStateStyles: {
    focused: { lineWidth: 1.5 }
  },
  animate: true,
  linkCenter: true
}
```

**v5 Configuration:**
```typescript
{
  behaviors: ['drag-canvas', 'drag-element'],
  node: {
    style: {
      size: 20,
      lineWidth: 1
    },
    state: {
      focused: { lineWidth: 1.5 }
    }
  },
  animation: true
  // linkCenter removed
}
```

### 3. API Method Changes

#### Data Management
- `graph.data(data)` → `graph.setData(data)`
- `graph.changeData(data)` → `graph.setData(data)`
- `graph.read(data)` → `graph.setData(data)` + `graph.render()`

#### Graph Sizing
- `graph.changeSize(width, height)` → `graph.setSize(width, height)`

#### Mode/Behavior Management
- `graph.setMode(mode)` → `graph.setBehaviors(behaviors)`

#### Element State Management
- `graph.setItemState(item, state, value)` → `graph.setElementState(id, states)`

#### Data Access
- `graph.getAllNodesData()` → `graph.getNodeData()`
- `graph.getAllEdgesData()` → `graph.getEdgeData()`
- `graph.refreshPositions()` → `graph.render()`

### 4. Event System Changes

#### Event Object Properties
**v4:**
```typescript
graph.on('node:click', (e) => {
  const fid = e.item._cfg.id;
});
```

**v5:**
```typescript
graph.on('node:click', (e) => {
  const fid = e.itemId;
});
```

### 5. Layout Updates
- Layout tick function now calls `graph.render()` instead of `graph.refreshPositions()`

### 6. Extension Registration (Temporarily Disabled)
The custom edge extension registration has been temporarily disabled due to API changes:

```typescript
// v4
G6.registerEdge('forbidden-edge', { /* config */ }, 'line');

// v5 - Requires further investigation
// register(ExtensionCategory.EDGE, 'forbidden-edge', { /* config */ });
```

## Files Modified

### Primary Files
1. `src/pages/causal/explorer/graph-utils.ts` - Core utilities and data formatting
2. `src/pages/causal/explorer/graph-helper.ts` - Graph lifecycle management and event handling
3. `src/pages/causal/functionalDependencies/FDGraph.tsx` - Functional dependencies graph
4. `src/pages/causal/explorer/graphView.tsx` - Main graph view component

### Key Changes Summary
- Updated imports from G6 v4 to v5
- Restructured data format to separate `data` and `style` objects
- Updated configuration object structure
- Migrated from `modes` to `behaviors`
- Updated API method calls to v5 equivalents
- Fixed event handling to use new event object structure

## Known Issues / TODO

1. **Custom Edge Extension**: The forbidden edge extension registration needs to be reimplemented using G6 v5's extension system.

2. **Arrow Path Format**: Changed from `path` property to `d` property for SVG path data in arrows.

3. **Label Configuration**: Edge label configuration has been moved from `labelCfg` to the data/style structure.

## Testing Requirements

The migration requires testing of:
- Node and edge rendering
- Interactive behaviors (drag, zoom, select)
- State management (focus, highlight, fade)
- Layout algorithms
- Custom styling and theming
- Event handling for clicks and interactions

## Conclusion

The migration from G6 v4 to v5 primarily involves:
1. Data structure reorganization
2. Configuration modernization  
3. API method updates
4. Event system changes

The core functionality has been preserved while adapting to G6 v5's improved architecture. Further testing and refinement may be needed for full compatibility.