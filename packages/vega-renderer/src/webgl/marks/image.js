import {sceneVisit as visit} from 'vega-scenegraph';
import {loadImageAndCreateTextureInfo} from '../util/image';

function getImage(item, renderer) {
  var image = item.image;
  if (!image || image.url !== item.url) {
    image = {loaded: false, width: 0, height: 0};
    renderer.loadImage(item.url).then(function(image) {
      item.image = image;
      item.image.url = item.url;
    });
  }
  return image;
}

function imageXOffset(align, w) {
  return align === 'center' ? w / 2 : align === 'right' ? w : 0;
}

function imageYOffset(baseline, h) {
  return baseline === 'middle' ? h / 2 : baseline === 'bottom' ? h : 0;
}

function drawGL(context, scene, bounds) {
  var renderer = this;

  visit(scene, function(item) {
    if (bounds && !bounds.intersects(item.bounds)) return; // bounds check

    var image = getImage(item, renderer),
        x = item.x || 0,
        y = item.y || 0,
        w = item.width || image.width || 0,
        h = item.height || image.height || 0;

    x -= imageXOffset(item.align, w);
    y -= imageYOffset(item.baseline, h);

    if (image.loaded) {
      var imgInfo = loadImageAndCreateTextureInfo(context, image);
      imgInfo.x = x + context._tx + context._origin[0];
      imgInfo.y = y + context._ty + context._origin[1];
      imgInfo.w = w;
      imgInfo.h = h;
      context._images.push(imgInfo);
    }
  });
}

export default {
  type:   'image',
  drawGL: drawGL
};
