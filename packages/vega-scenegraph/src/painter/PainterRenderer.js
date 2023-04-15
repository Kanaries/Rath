import WebGLRenderer from '../webgl/WebGLRenderer';
import {drawImage, loadImageAndCreateTextureInfo} from '../webgl/util/image';
import { testConfig } from '@kanaries/rath-utils/dist/testConfig';

class PainterRenderer extends WebGLRenderer {
  constructor(imageLoader) {
    super(imageLoader);
  }
  initialize(el, width, height, origin) {
    if (testConfig.printLog) {
      console.trace("Painter Renderer");
    }
    const init = super.initialize(el, width, height, origin);
    return init;
  }
  resize(width, height, origin) {
    const resize = super.resize(width, height, origin);
    return resize;
  }
  _render(scene, items) {

    var gl = this.context(),
        b, i;

    gl._tx = 0;
    gl._ty = 0;
    gl._triangleGeometry = [];
    gl._triangleColor = [];
    if (gl._images) {
      for (i = 0; i < gl._images.length; i++) {
        gl.deleteTexture(gl._images[i].texture);
      }
    }
    gl._images = [];
    gl._randomZ = this._randomZ;
    gl._pathCacheHit = 0;
    gl._pathCacheMiss = 0;
    gl._itemCacheHit = 0;
    gl._itemCacheMiss = 0;
    gl._shapeCacheHit = 0;
    gl._shapeCacheMiss = 0;

    b = (!items || this._redraw)
      ? (this._redraw = false, null)
      // : clipToBounds(gl, items);
      : undefined;

    if (items) {
      for (i = 0; i < items.length; i++) {
        items[i]._dirty = true;
        if (items[i].exit && sceneMarks[items[i].mark.marktype].nested && items[i].mark.items.length) {
          // Mark an item as dirty to force redraw of the nested mark
          items[i].mark.items[0]._dirty = true;
        }
      }
    } else {
      gl._fullRedraw = true;
    }

    if (this._depthTest) {
      gl.enable(gl.DEPTH_TEST);
    } else {
      gl.disable(gl.DEPTH_TEST);
    }

    this._updateUniforms();

    this.clear();

    this.draw(gl, scene, b);

    var imgInfo = loadImageAndCreateTextureInfo(gl, gl._textCanvas);
    imgInfo.x = 0;
    imgInfo.y = 0;
    imgInfo.w = gl.canvas.width / gl._ratio;
    imgInfo.h = gl.canvas.height / gl._ratio;
    gl._images.push(imgInfo);

    for (i = 0; i < gl._images.length; i++) {
      drawImage(gl, gl._images[i], this.matrix);
    }

    if (items) {
      for (i = 0; i < items.length; i++) {
        items[i]._dirty = false;
      }
    }
    gl._fullRedraw = false;
    this._lastScene = scene;

    // console.log('Path cache hit: ' + gl._pathCacheHit);
    // console.log('Path cache miss: ' + gl._pathCacheMiss);
    // console.log('Item cache hit: ' + gl._itemCacheHit);
    // console.log('Item cache miss: ' + gl._itemCacheMiss);
    // console.log('Shape cache hit: ' + gl._shapeCacheHit);
    // console.log('Shape cache miss: ' + gl._shapeCacheMiss);

    return this;
  }
  clear() {
    super.clear();
  }
}

export default PainterRenderer;