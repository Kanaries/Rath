import {pathCurves, pathSymbols, pathRectangle, pathTrail} from 'vega-scenegraph';

import geometryForPath from './geometryForPath';

import {
  arc as d3_arc,
  symbol as d3_symbol,
  area as d3_area,
  line as d3_line
} from 'd3-shape';

function x(item)     { return item.x || 0; }
function y(item)     { return item.y || 0; }
function w(item)     { return item.width || 0; }
function wh(item)    { return item.width || item.height || 1; }
function h(item)     { return item.height || 0; }
function xw(item)    { return (item.x || 0) + (item.width || 0); }
function yh(item)    { return (item.y || 0) + (item.height || 0); }
function cr(item)    { return item.cornerRadius || 0; }
function pa(item)    { return item.padAngle || 0; }
function def(item)   { return !(item.defined === false); }
function size(item)  { return item.size == null ? 64 : item.size; }
function type(item) { return pathSymbols(item.shape || 'circle'); }

var arcShape    = d3_arc().cornerRadius(cr).padAngle(pa),
    areavShape  = d3_area().x(x).y1(y).y0(yh).defined(def),
    areahShape  = d3_area().y(y).x1(x).x0(xw).defined(def),
    lineShape   = d3_line().x(x).y(y).defined(def),
    trailShape  = pathTrail().x(x).y(y).defined(def).size(wh),
    rectShape   = pathRectangle().x(x).y(y).width(w).height(h).cornerRadius(cr),
    rectShapeGL = pathRectangle().x(0).y(0).width(w).height(h).cornerRadius(cr),
    symbolShape = d3_symbol().type(type).size(size);

export function arc(context, item) {
  if (!context || context.arc) {
    return arcShape.context(context)(item);
  }
  return geometryForPath(context, arcShape.context(null)(item), 0.1);
}

export function area(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear',
      s = (interp === 'trail' ? trailShape
        : (item.orient === 'horizontal' ? areahShape : areavShape)
            .curve(pathCurves(interp, item.orient, item.tension))
      )
  if (!context || context.arc) {
    return s.context(context)(items);
  }
  return geometryForPath(context, s.context(null)(items), 0.1);
}

export function shape(context, item) {
  var s = item.mark.shape || item.shape;
  if (!context || context.arc) {
    return s.context(context)(item);
  }
  return geometryForPath(context, s.context(null)(item), 0.1);
}

export function line(context, items) {
  var item = items[0],
      interp = item.interpolate || 'linear',
      s = lineShape.curve(pathCurves(interp, item.orient, item.tension));
  if (!context || context.arc) {
    return s.context(context)(items);
  }
  return geometryForPath(context, s.context(null)(items));
}

export function rectangle(context, item, x, y) {
  return rectShape.context(context)(item, x, y);
}

export function rectangleGL(context, item, x, y) {
  return geometryForPath(context, rectShapeGL.context(null)(item, x, y), 0.1);
}

export function symbol(context, item) {
  if (!context || context.arc) {
    return symbolShape.context(context)(item);
  }
  return geometryForPath(context, symbolShape.context(null)(item), 0.1);
}
