import {sceneVisit as visit} from 'vega-scenegraph';
import drawGeometry from '../util/drawGeometry';
import geometryForItem from '../path/geometryForItem';

function drawGL(context, scene, bounds) {
  visit(scene, function(item) {
    var x1, y1, x2, y2, shapeGeom;
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check
    if (context._fullRedraw || item._dirty || !item._geom || item._geom.deleted) {
      x1 = item.x || 0;
      y1 = item.y || 0;
      x2 = item.x2 != null ? item.x2 : x1;
      y2 = item.y2 != null ? item.y2 : y1;
      shapeGeom = {
        lines: [[[x1, y1], [x2, y2]]],
        closed: false
      };
      shapeGeom.key = JSON.stringify(shapeGeom.lines);
      item._geom = geometryForItem(context, item, shapeGeom);
    }
    drawGeometry(item._geom, context, item);
  });
}

export default {
  type:   'rule',
  drawGL: drawGL
};
