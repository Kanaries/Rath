import {sceneVisit as visit} from 'vega-scenegraph';
import {rectangleGL} from '../path/shapes';
import geometryForItem from '../path/geometryForItem';
import drawGeometry from '../util/drawGeometry';

function drawGL(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(group) {
    var gx = group.x || 0,
        gy = group.y || 0,
        w = group.width || 0,
        h = group.height || 0,
        offset, oldClip;

    // setup graphics context
    context._tx += gx;
    context._ty += gy;
    context._textContext.save();
    context._textContext.translate(gx, gy);

    // draw group background
    if (context._fullRedraw || group._dirty || !group._geom || group._geom.deleted) {
      offset = group.stroke ? 0.5 : 0;
      var shapeGeom = rectangleGL(context, group, offset, offset);
      group._geom = geometryForItem(context, group, shapeGeom);
    }
    drawGeometry(group._geom, context, group);

    // set clip and bounds
    if (group.clip) {
      oldClip = context._clip;
      context._clip = [
        context._origin[0] + context._tx,
        context._origin[1] + context._ty,
        context._origin[0] + context._tx + w,
        context._origin[1] + context._ty + h
      ];
    }
    if (bounds) bounds.translate(-gx, -gy);

    // draw group contents
    visit(group, function(item) {
      renderer.draw(context, item, bounds);
    });

    // restore graphics context
    if (bounds) bounds.translate(gx, gy);
    if (group.clip) {
      context._clip = oldClip;
    }

    context._tx -= gx;
    context._ty -= gy;
    context._textContext.restore();
  });
}

export default {
  type:       'group',
  drawGL:     drawGL
};
