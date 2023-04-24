import { renderModule } from 'vega-scenegraph';
import { PainterModule } from '..';

/**
 * It automatically changes the view renderer to PainterModule.
 * @param {import('../interface').IPainterDrawConfig} config
 * @returns { {mutIndices: Set<number>, mutValues: Datum[], changes: import('vega-typings').Changeset} }
 */
export function paint(config) {
  let view = config.view;
  if (view.renderer() !== 'painter') {
    // TODO: [Discuss] Make `PainterModule` a plugin of the current renderer?
    renderModule('painter', PainterModule);
    view = view.renderer('painter');
  }
  /** @type {import('..').PainterRenderer} */
  const renderer = view._renderer;
  // const res = _paint(view.scenegraph(), config);
  const {
    painterMode, changes, fields, point, radius, range, limits, groupKey='_lab_field', groupValue='_selected', indexKey='_label_index', newColor=''
  } = config;
  /** @type {'circle' | 'range'} */
  let viewMode;
  if (Array.isArray(range)){
    if (range.length >= 2) viewMode = 'circle';
    else viewMode = 'range';
  }
  else if (Number.isFinite(range)) viewMode = 'range';
  else throw "Invalid range";

  const ans = {
    mutIndices: new Set(),
    mutValues: [],
    changes: changes,
    view: view,
  }

  let items = [];
  let test;

  if (viewMode === 'circle') {
    test = function(item) {
      if (((item.datum[fields[0]] - point[0]) ** 2) / (range[0] ** 2) +
        ((item.datum[fields[1]] - point[1]) ** 2) / (range[1] ** 2) <= (radius ** 2)) {
          return true;
      }
      return false;
    } 
  } else if (viewMode === 'range') {
    test = function(item) {
      const a = (Array.isArray(range)) ? range[0] : range;
      // Math.abs(mutData[i][fields[1]] - point[1]) < r * Math.sqrt(range))
      if (item.datum[fields[1]] === point[1] && 
        (Math.abs(item.datum[fields[0]] - point[0]) < radius * Math.sqrt(a))) {
        return true;
      } 
      return false;
    }
  }
  items = renderer.selectItems(view.scenegraph());
  if (painterMode === 'color') {
    for (let item of items) if (test(item)) {
      item.fill = newColor;
      item.datum[groupKey] = groupValue;
      ans.mutIndices.add(item.datum[indexKey]);
      ans.mutValues.push(item.datum);
    }
  }
  else {
    for (let item of items) if (test(item)) {
      item.fill = "#ffffff";
      item.opacity = 0;
      item.size = 0;
      ans.mutIndices.add(item.datum[indexKey]);
      // ans.mutValues.push(item.datum);
    }
  }
  renderer.renderAsync(view.scenegraph().root);

  return ans;
}

/**
 * @param {import('vega-typings').View} view
 */
export function startPaint(view) {
  view._renderer.isPainting = true;
}
/**
 * @param {import('vega-typings').View} view 
 */
export function stopPaint(view) {
  view._renderer.isPainting = false;
}