import {sceneVisit as visit} from 'vega-scenegraph';
import drawGeometry from '../util/drawGeometry';
import geometryForPath from '../path/geometryForPath';
import geometryForItem from '../path/geometryForItem';

function drawGL(context, scene) {
  visit(scene, function(item) {
    var path = item.path;
    if (path == null) return true;

    var x = item.x || 0,
        y = item.y || 0;

    context._tx += x;
    context._ty += y;

    if (context._fullRedraw || item._dirty || !item._geom || item._geom.deleted) {
      var shapeGeom = geometryForPath(context, path);
      item._geom = geometryForItem(context, item, shapeGeom);
    }
    drawGeometry(item._geom, context, item);

    context._tx -= x;
    context._ty -= y;
  });
}

export default {
  type:   'path',
  drawGL: drawGL
};
