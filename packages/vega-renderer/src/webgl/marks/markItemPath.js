import {sceneVisit as visit} from 'vega-scenegraph';
import drawGeometry from '../util/drawGeometry';
import geometryForItem from '../path/geometryForItem';

export default function(type, shape) {

  function drawGL(context, scene, bounds) {
    visit(scene, function(item) {
      if (bounds && !bounds.intersects(item.bounds)) return; // bounds check

      var x = item.x || 0,
          y = item.y || 0,
          shapeGeom;

      context._tx += x;
      context._ty += y;

      if (context._fullRedraw || item._dirty || !item._geom || item._geom.deleted) {
        shapeGeom = shape(context, item);
        item._geom = geometryForItem(context, item, shapeGeom);
      }
      drawGeometry(item._geom, context, item);

      context._tx -= x;
      context._ty -= y;
    });
  }

  return {
    type:   type,
    drawGL: drawGL
  };

}
