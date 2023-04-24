import drawGeometry from '../util/drawGeometry';
import geometryForItem from '../path/geometryForItem';

export default function(type, shape) {

  function drawGL(context, scene, bounds) {
    if (scene.items.length && (!bounds || bounds.intersects(scene.bounds))) {
      var item = scene.items[0];
      var dirty = false;
      for (var i = 0; i < scene.items.length; i++) {
        if (scene.items[i]._dirty) {
          dirty = true;
          break;
        }
      }
      if (context._fullRedraw || dirty || !item._geom || item._geom.deleted) {
        var shapeGeom = shape(context, scene.items);
        item._geom = geometryForItem(context, item, shapeGeom);
      }
      drawGeometry(item._geom, context, item);
    }
  }

  return {
    type:   type,
    drawGL: drawGL
  };

}
