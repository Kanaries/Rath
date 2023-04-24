import {Renderer, domClear as clear, Marks as sceneMarks} from 'vega-scenegraph';
import marks from './marks/index';
import inherits from './util/inherits';
import WebGL from './util/webgl';
import resize from './util/resize';
import color from './util/color';
import {drawImage, loadImageAndCreateTextureInfo} from './util/image';
import {perspective, rotateX, rotateY, rotateZ, multiply, translate as translateGL} from './util/matrix';

export default function WebGLRenderer(imageLoader) {
  Renderer.call(this, imageLoader);
  this._redraw = false;
  this._angleX = 0;
  this._angleY = 0;
  this._angleZ = 0;
  this._translateX = 0;
  this._translateY = 0;
  this._translateZ = 0;
  this._zFactor = 0;
  this._depthTest = false;
  this._randomZ = false;
}

var prototype = inherits(WebGLRenderer, Renderer),
    base = Renderer.prototype;

prototype.initialize = function(el, width, height, origin) {
  this._canvas = WebGL(1, 1); // instantiate a small canvas
  if (el) {
    clear(el, 0).appendChild(this._canvas);
    this._canvas.setAttribute('class', 'marks');
  }
  // this method will invoke resize to size the canvas appropriately
  return base.initialize.call(this, el, width, height, origin);
};

prototype.resize = function(width, height, origin) {
  base.resize.call(this, width, height, origin);
  resize(this._canvas, this._width, this._height, this._origin);
  return this._redraw = true, this;
};

prototype.canvas = function() {
  return this._canvas;
};

prototype.context = function() {
  return this._canvas ? (
    this._canvas.getContext('webgl') ||
    this._canvas.getContext('experimental-webgl'))
    : null;
};

prototype.rotate = function(x, y, z) {
  this._angleX = x;
  this._angleY = y;
  this._angleZ = z;
  return this;
};

prototype.translate = function(x, y, z) {
  this._translateX = x;
  this._translateY = y;
  this._translateZ = z;
  return this;
};

prototype.zFactor = function(z) {
  this._zFactor = z;
  return this;
};

prototype.depthTest = function(val) {
  this._depthTest = val;
  return this;
};

prototype.randomZ = function(val) {
  this._randomZ = val;
  return this;
};

// function clipToBounds(g, items) {
//   // TODO: do something here?
// }

prototype._updateUniforms = function() {
  var gl = this.context();
  gl.useProgram(gl._shaderProgram);

  var width = gl.canvas.width / gl._ratio;
  var height = gl.canvas.height / gl._ratio;

  var smooshMatrix = [
    2/width, 0, 0, 0,
    0, -2/width, 0, 0,
    0, 0, 1, 0,
    -1, height/width, 0, 1
  ];

  this.matrix = [
    1, 0, 0, 0,
    0, 1, 0, 0,
    0, 0, 1, 0,
    0, 0, 0, 1
  ];

  this.matrix = multiply(this.matrix, perspective(Math.PI/2, width/height, 0.01, 3000));
  this.matrix = multiply(this.matrix, translateGL(this._translateX, this._translateY, (this._translateZ - 1)*height/width));
  this.matrix = multiply(this.matrix, rotateZ(this._angleZ));
  this.matrix = multiply(this.matrix, rotateY(this._angleY));
  this.matrix = multiply(this.matrix, rotateX(this._angleX));
  this.matrix = multiply(this.matrix, translateGL(0, 0, 1));
  this.matrix = multiply(this.matrix, smooshMatrix);

  gl._matrix = this.matrix;

  gl.uniform1f(gl._zFactorLocation, this._zFactor);
  gl.uniformMatrix4fv(gl._matrixLocation, false, this.matrix);
}

prototype._render = function(scene, items) {
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
};

prototype.frame = function() {
  if (this._lastScene) {
    this._render(this._lastScene, []);
  }
  return this;
};

prototype.draw = function(ctx, scene, bounds) {
  var mark = marks[scene.marktype];
  if (mark.drawGL) {
    mark.drawGL.call(this, ctx, scene, bounds);
  }
};

prototype.toDataURL = function(scene) {
  this.render(scene, null);
  return this.canvas().toDataURL("image/png", 1);
};

prototype.clear = function() {
  var gl = this.context(), c;
  if (this._bgcolor != null) {
    c = color(gl, null, this._bgcolor);
    gl.clearColor(c[0], c[1], c[2], 1.0);
  } else {
    gl.clearColor(1.0, 1.0, 1.0, 1.0);
  }
  gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

  gl._textContext.save();
  gl._textContext.setTransform(1, 0, 0, 1, 0, 0);
  gl._textContext.clearRect(0, 0, gl._textCanvas.width, gl._textCanvas.height);
  gl._textContext.restore();
};
