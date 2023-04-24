export var WebGL;

export default function(w, h) {
  var canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

  gl._pathCache = {};
  gl._pathCacheSize = 0;
  gl._itemCache = {};
  gl._itemCacheSize = 0;
  gl._shapeCache = {};
  gl._shapeCacheSize = 0;

  gl._textCanvas = document.createElement('canvas');
  gl._textCanvas.width = w;
  gl._textCanvas.height = h;
  gl._textContext = gl._textCanvas.getContext('2d');
  canvas._textCanvas = gl._textCanvas;

  gl.clearColor(1.0, 1.0, 1.0, 1.0);
  gl.disable(gl.CULL_FACE);

  // Thanks to https://limnu.com/webgl-blending-youre-probably-wrong/
  gl.disable(gl.DEPTH_TEST);
  gl.enable(gl.BLEND);
  gl.blendFuncSeparate(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA, gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

  var vertCode =
    'attribute vec3 coordinates;' +
    'attribute vec4 color;' +
    'uniform mat4 matrix;' +
    'uniform float zFactor;' +
    'uniform vec2 offset;' +
    'varying vec4 vColor;' +
    'varying vec4 vPosition;' +
    'void main(void) {' +
    '  vPosition = vec4(coordinates.x + offset.x, coordinates.y + offset.y, coordinates.z*zFactor - 1.0, 1.0);' +
    '  gl_Position = matrix * vPosition;' +
    '  vColor = color;' +
    '}';
  var vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(vertShader);
  }

  var fragCode =
    'precision mediump float;' +
    'varying vec4 vColor;' +
    'varying vec4 vPosition;' +
    'uniform vec4 clip;' +
    'void main(void) {' +
    '  if (vPosition.x < clip[0] || vPosition.x > clip[2] || vPosition.y < clip[1] || vPosition.y > clip[3]) {' +
    '    discard;' +
    '  }' +
    '  gl_FragColor = vColor;' +
    '}';
  var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(fragShader);
  }

  var shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);
  gl.useProgram(shaderProgram);
  gl._shaderProgram = shaderProgram;
  gl._coordLocation = gl.getAttribLocation(gl._shaderProgram, 'coordinates');
  gl._colorLocation = gl.getAttribLocation(gl._shaderProgram, 'color');
  gl._matrixLocation = gl.getUniformLocation(gl._shaderProgram, 'matrix');
  gl._zFactorLocation = gl.getUniformLocation(gl._shaderProgram, 'zFactor');
  gl._offsetLocation = gl.getUniformLocation(gl._shaderProgram, 'offset');
  gl._clipLocation = gl.getUniformLocation(gl._shaderProgram, 'clip');

// -------------------------------------------------------------------------
// BEGIN: Adapted from https://github.com/greggman/webgl-fundamentals
//
// BSD license follows:
//
// Copyright 2012, Gregg Tavares.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Gregg Tavares. nor the names of his
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

  vertCode =
    'attribute vec2 a_position;' +
    'attribute vec2 a_texcoord;' +
    'uniform mat4 u_matrix;' +
    'varying vec2 v_texcoord;' +
    'void main() {' +
    '  gl_Position = u_matrix * vec4(a_position, -1.0, 1.0);' +
    '  v_texcoord = a_texcoord;' +
    '}';
  vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(vertShader);
  }

  fragCode =
    'precision mediump float;' +
    'varying vec2 v_texcoord;' +
    'uniform sampler2D u_texture;' +
    'void main() {' +
    '  gl_FragColor = texture2D(u_texture, v_texcoord);' +
    '}';
  fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(fragShader);
  }

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);

  var positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  var positions = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  var texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  var texcoords = [
    0, 0,
    0, 1,
    1, 0,
    1, 0,
    0, 1,
    1, 1
  ];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

  gl._imageShaderProgram = shaderProgram;
  gl._imagePositionLocation = gl.getAttribLocation(gl._imageShaderProgram, 'a_position');
  gl._imageTexcoordLocation = gl.getAttribLocation(gl._imageShaderProgram, 'a_texcoord');
  gl._imageMatrixLocation = gl.getUniformLocation(gl._imageShaderProgram, 'u_matrix');
  gl._imageTextureLocation = gl.getUniformLocation(gl._imageShaderProgram, 'u_texture');
  gl._imagePositionBuffer = positionBuffer;
  gl._imageTexcoordBuffer = texcoordBuffer;

// END: Adapted from https://github.com/greggman/webgl-fundamentals
// -------------------------------------------------------------------------

  vertCode = [
    'attribute vec3 pos;',
    'attribute vec3 fillColor;',
    'attribute vec3 strokeColor;',
    'attribute float fillOpacity;',
    'attribute float strokeWidth;',
    'attribute float size;',
    'attribute float shape;',
    'attribute float strokeOpacity;',
    'attribute vec2 unit;',
    'uniform mat4 matrix;',
    'varying vec4 positionVar;',
    'varying vec4 fillColorVar;',
    'varying vec4 strokeColorVar;',
    'varying float sizeVar;',
    'varying float shapeVar;',
    'varying float strokeWidthVar;',
    'varying vec2 unitVar;',
    'void main(void)',
    '{',
    '  strokeWidthVar = strokeWidth;',
    '  fillColorVar = vec4(fillColor, fillOpacity);',
    '  strokeColorVar = vec4(strokeColor, strokeOpacity);',

    // circle
    '  if (shape == 0.0) {',
    '    sizeVar = sqrt(size) / 2.0;',
    '  }',

    // cross
    '  if (shape == 1.0) {',
    '    sizeVar = sqrt(size) / 2.0;',
    '  }',

    // diamond
    '  if (shape == 2.0) {',
    '    sizeVar = sqrt(size) / 2.0;',
    '  }',

    // square
    '  if (shape == 3.0) {',
    '    sizeVar = sqrt(2.0) * sqrt(size) / 2.0;',
    '  }',

    // star
    '  if (shape == 4.0) {',
    '    sizeVar = sqrt(size) / 2.0;',
    '  }',

    // triangle-up
    '  if (shape == 5.0) {',
    '    sizeVar = (sqrt(6.0)/2.0) * sqrt(size) / 2.0;',
    '  }',

    // triangle-right
    '  if (shape == 6.0) {',
    '    sizeVar = (sqrt(6.0)/2.0) * sqrt(size) / 2.0;',
    '  }',

    // triangle-down
    '  if (shape == 7.0) {',
    '    sizeVar = (sqrt(6.0)/2.0) * sqrt(size) / 2.0;',
    '  }',

    // triangle-left
    '  if (shape == 8.0) {',
    '    sizeVar = (sqrt(6.0)/2.0) * sqrt(size) / 2.0;',
    '  }',

    // wye
    '  if (shape == 9.0) {',
    '    sizeVar = sqrt(size) / 2.0;',
    '  }',

    // '  sizeVar = size;',
    '  shapeVar = shape;',
    // '  float m = size + strokeWidth;',
    '  float factor = (sizeVar + strokeWidth / 2.0 + 1.0) / sizeVar;',
    '  unitVar = factor * unit;',
    '  positionVar = vec4(pos.xy + factor * sizeVar * unit, -1.0, 1.0);',
    '  gl_Position = matrix * positionVar;',
    '}'
  ].join('\n');
  vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(vertShader);
  }

  fragCode = [
    'precision mediump float;',
    'const float PI = 3.1415926535897932384626433832795;',
    'varying vec4 positionVar;',
    'varying vec4 fillColorVar;',
    'varying vec4 strokeColorVar;',
    'varying vec2 unitVar;',
    'varying float sizeVar;',
    'varying float shapeVar;',
    'varying float strokeWidthVar;',
    'uniform vec4 clip;',

    'float distToLine(vec2 pt1, vec2 pt2, vec2 testPt)',
    '{',
    '  vec2 lineDir = pt2 - pt1;',
    '  vec2 perpDir = vec2(lineDir.y, -lineDir.x);',
    '  vec2 dirToPt1 = pt1 - testPt;',
    '  return dot(normalize(perpDir), dirToPt1);',
    '}',

    'float distToAngle(vec2 apex, vec2 left, vec2 right, vec2 testPt)',
    '{',
    '  float dist = distToLine(apex, left, testPt);',
    '  dist = min(dist, distToLine(right, apex, testPt));',
    '  float cut = distToLine(left, right, testPt);',
    '  if (cut < 0.0) return -1.0;',
    '  return dist;',
    '}',

    'float distToHull(vec2 p1, vec2 p2, vec2 p3, vec2 p4, vec2 testPt)',
    '{',
    '  float dist = distToLine(p1, p2, testPt);',
    '  dist = min(dist, distToLine(p2, p3, testPt));',
    '  dist = min(dist, distToLine(p4, p1, testPt));',
    '  float cut = distToLine(p3, p4, testPt);',
    '  if (cut < 0.0) return -1.0;',
    '  return dist;',
    '}',

    'vec2 rotate(vec2 pt, float a)',
    '{',
    '  return vec2(cos(a)*pt.x - sin(a)*pt.y, sin(a)*pt.x + cos(a)*pt.y);',
    '}',

    'void main () {',
    '  if (positionVar.x < clip[0] || positionVar.x > clip[2] || positionVar.y < clip[1] || positionVar.y > clip[3]) {',
    '    discard;',
    '  }',

    '  float dist;',
    '  float d1;',
    '  float d2;',

    // circle
    '  if (shapeVar == 0.0) {',
    '    dist = length(unitVar);',
    '  }',

    // cross
    '  if (shapeVar == 1.0) {',
    '    float inset = 1.0 / 2.5;',
    '    d1 = distToLine(vec2(-inset, -1.0), vec2(inset, -1.0), unitVar);',
    '    d1 = min(d1, distToLine(vec2(inset, -1.0), vec2(inset, 1.0), unitVar));',
    '    d1 = min(d1, distToLine(vec2(inset, 1.0), vec2(-inset, 1.0), unitVar));',
    '    d1 = min(d1, distToLine(vec2(-inset, 1.0), vec2(-inset, -1.0), unitVar));',
    '    d1 = 1.0 - d1;',
    '    d2 = distToLine(vec2(1.0, -inset), vec2(1.0, inset), unitVar);',
    '    d2 = min(d2, distToLine(vec2(1.0, inset), vec2(-1.0, inset), unitVar));',
    '    d2 = min(d2, distToLine(vec2(-1.0, inset), vec2(-1.0, -inset), unitVar));',
    '    d2 = min(d2, distToLine(vec2(-1.0, -inset), vec2(1.0, -inset), unitVar));',
    '    d2 = 1.0 - d2;',
    '    dist = min(d1, d2);',
    '  }',

    // diamond
    '  if (shapeVar == 2.0) {',
    '    dist = distToLine(vec2(0.0, -1.0), vec2(1.0, 0.0), unitVar);',
    '    dist = min(dist, distToLine(vec2(1.0, 0.0), vec2(0.0, 1.0), unitVar));',
    '    dist = min(dist, distToLine(vec2(0.0, 1.0), vec2(-1.0, 0.0), unitVar));',
    '    dist = min(dist, distToLine(vec2(-1.0, 0.0), vec2(0.0, -1.0), unitVar));',
    '    dist = 1.0 - dist;',
    '  }',

    // square
    '  if (shapeVar == 3.0) {',
    '    float side = sqrt(2.0)/2.0;',
    '    dist = distToLine(vec2(-side, -side), vec2(side, -side), unitVar);',
    '    dist = min(dist, distToLine(vec2(side, -side), vec2(side, side), unitVar));',
    '    dist = min(dist, distToLine(vec2(side, side), vec2(-side, side), unitVar));',
    '    dist = min(dist, distToLine(vec2(-side, side), vec2(-side, -side), unitVar));',
    '    dist = 1.0 - dist;',
    '  }',

    // star
    '  if (shapeVar == 4.0) {',
    '    float h = 1.0;',
    '    float x = h * tan(PI/10.0);',
    '    vec2 p1 = vec2(0.0, -h);',
    '    vec2 p2 = vec2(x, 0);',
    '    vec2 p3 = vec2(-x, 0);',
    '    float angle = 0.0;',
    '    dist = 1.0 - distToAngle(rotate(p1, angle), rotate(p2, angle), rotate(p3, angle), unitVar);',
    '    angle = angle + 2.0*PI/5.0;',
    '    dist = min(dist, 1.0 - distToAngle(rotate(p1, angle), rotate(p2, angle), rotate(p3, angle), unitVar));',
    '    angle = angle + 2.0*PI/5.0;',
    '    dist = min(dist, 1.0 - distToAngle(rotate(p1, angle), rotate(p2, angle), rotate(p3, angle), unitVar));',
    '    angle = angle + 2.0*PI/5.0;',
    '    dist = min(dist, 1.0 - distToAngle(rotate(p1, angle), rotate(p2, angle), rotate(p3, angle), unitVar));',
    '    angle = angle + 2.0*PI/5.0;',
    '    dist = min(dist, 1.0 - distToAngle(rotate(p1, angle), rotate(p2, angle), rotate(p3, angle), unitVar));',
    '  }',

    // triangle-up
    '  if (shapeVar == 5.0) {',
    '    vec2 p1 = vec2(0.0, -sqrt(2.0)/2.0);',
    '    vec2 p2 = vec2(sqrt(6.0)/3.0, sqrt(2.0)/2.0);',
    '    vec2 p3 = vec2(-sqrt(6.0)/3.0, sqrt(2.0)/2.0);',
    '    dist = distToLine(p1, p2, unitVar);',
    '    dist = min(dist, distToLine(p2, p3, unitVar));',
    '    dist = min(dist, distToLine(p3, p1, unitVar));',
    '    dist = 1.0 - dist;',
    '  }',

    // triangle-right
    '  if (shapeVar == 6.0) {',
    '    vec2 p1 = vec2(sqrt(2.0)/2.0, 0.0);',
    '    vec2 p2 = vec2(-sqrt(2.0)/2.0, sqrt(6.0)/3.0);',
    '    vec2 p3 = vec2(-sqrt(2.0)/2.0, -sqrt(6.0)/3.0);',
    '    dist = distToLine(p1, p2, unitVar);',
    '    dist = min(dist, distToLine(p2, p3, unitVar));',
    '    dist = min(dist, distToLine(p3, p1, unitVar));',
    '    dist = 1.0 - dist;',
    '  }',

    // triangle-down
    '  if (shapeVar == 7.0) {',
    '    vec2 p1 = vec2(0.0, sqrt(2.0)/2.0);',
    '    vec2 p2 = vec2(-sqrt(6.0)/3.0, -sqrt(2.0)/2.0);',
    '    vec2 p3 = vec2(sqrt(6.0)/3.0, -sqrt(2.0)/2.0);',
    '    dist = distToLine(p1, p2, unitVar);',
    '    dist = min(dist, distToLine(p2, p3, unitVar));',
    '    dist = min(dist, distToLine(p3, p1, unitVar));',
    '    dist = 1.0 - dist;',
    '  }',

    // triangle-left
    '  if (shapeVar == 8.0) {',
    '    vec2 p1 = vec2(-sqrt(2.0)/2.0, 0.0);',
    '    vec2 p2 = vec2(sqrt(2.0)/2.0, -sqrt(6.0)/3.0);',
    '    vec2 p3 = vec2(sqrt(2.0)/2.0, sqrt(6.0)/3.0);',
    '    dist = distToLine(p1, p2, unitVar);',
    '    dist = min(dist, distToLine(p2, p3, unitVar));',
    '    dist = min(dist, distToLine(p3, p1, unitVar));',
    '    dist = 1.0 - dist;',
    '  }',

    // wye
    '  if (shapeVar == 9.0) {',
    '    float h = 12.0 / (12.0 + sqrt(12.0));',
    '    float y = h / sqrt(12.0) + h;',
    '    vec2 p1 = vec2(h / 2.0, y);',
    '    vec2 p2 = vec2(-h / 2.0, y);',
    '    vec2 p3 = vec2(-h / 2.0, 0.0);',
    '    vec2 p4 = vec2(h / 2.0, 0.0);',
    '    float angle = 0.0;',
    '    dist = 1.0 - distToHull(p1, p2, p3, p4, unitVar);',
    '    angle = angle + 2.0*PI/3.0;',
    '    dist = min(dist, 1.0 - distToHull(rotate(p1, angle), rotate(p2, angle), rotate(p3, angle), rotate(p4, angle), unitVar));',
    '    angle = angle + 2.0*PI/3.0;',
    '    dist = min(dist, 1.0 - distToHull(rotate(p1, angle), rotate(p2, angle), rotate(p3, angle), rotate(p4, angle), unitVar));',
    '  }',

    '  float endStep = 1.0;',
    '  float antialiasDist = 1.0 / sizeVar / 2.0;',
    '  float widthDist = strokeWidthVar / sizeVar / 2.0;',
    '  vec4 c1;',
    '  vec4 c2;',
    '  float step;',
    '  if (dist < endStep) {',
    '    step = smoothstep(endStep - widthDist - antialiasDist, endStep - widthDist + antialiasDist, dist);',
    '    if (fillColorVar.a > 0.0) {',
    '      c1 = fillColorVar;',
    '    } else {',
    '      c1 = vec4(strokeColorVar.rgb, 0.0);',
    '    }',
    '    if (strokeColorVar.a > 0.0) {',
    '      c2 = strokeColorVar;',
    '    } else {',
    '      c2 = vec4(fillColorVar.rgb, 0.0);',
    '    }',
    '  } else {',
    '    step = smoothstep(endStep + widthDist - antialiasDist, endStep + widthDist + antialiasDist, dist);',
    '    if (strokeColorVar.a > 0.0) {',
    '      c1 = strokeColorVar;',
    '      c2 = vec4(strokeColorVar.rgb, 0.0);',
    '    } else {',
    '      c1 = vec4(fillColorVar.rgb, 0.0);',
    '      c2 = vec4(fillColorVar.rgb, 0.0);',
    '    }',
    '  }',
    '  gl_FragColor = mix(c1, c2, step);',
    '}'
  ].join('\n');
  fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(fragShader);
  }

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);

  gl._symbolShaderProgram = shaderProgram;
  gl._symbolPosLocation = gl.getAttribLocation(shaderProgram, 'pos');
  gl._symbolFillColorLocation = gl.getAttribLocation(shaderProgram, 'fillColor');
  gl._symbolStrokeColorLocation = gl.getAttribLocation(shaderProgram, 'strokeColor');
  gl._symbolFillOpacityLocation = gl.getAttribLocation(shaderProgram, 'fillOpacity');
  gl._symbolStrokeWidthLocation = gl.getAttribLocation(shaderProgram, 'strokeWidth');
  gl._symbolSizeLocation = gl.getAttribLocation(shaderProgram, 'size');
  gl._symbolShapeLocation = gl.getAttribLocation(shaderProgram, 'shape');
  gl._symbolStrokeOpacityLocation = gl.getAttribLocation(shaderProgram, 'strokeOpacity');
  gl._symbolUnitLocation = gl.getAttribLocation(shaderProgram, 'unit');
  gl._symbolMatrixLocation = gl.getUniformLocation(shaderProgram, 'matrix');
  gl._symbolClipLocation = gl.getUniformLocation(shaderProgram, 'clip');

  // rect shader

  vertCode = [
    'attribute vec3 pos;',
    'attribute vec3 fillColor;',
    'attribute vec3 strokeColor;',
    'attribute float fillOpacity;',
    'attribute float strokeWidth;',
    'attribute float strokeOpacity;',
    'attribute float cornerRadius;',
    'attribute vec2 size;',
    'attribute vec2 unit;',
    'uniform mat4 matrix;',
    'varying vec4 fillColorVar;',
    'varying vec4 strokeColorVar;',
    'varying float strokeWidthVar;',
    'varying float cornerRadiusVar;',
    'varying float factorVar;',
    'varying vec2 sizeVar;',
    'varying vec2 unitVar;',
    'varying vec4 positionVar;',
    'void main(void)',
    '{',
    '  strokeWidthVar = strokeWidth;',
    '  fillColorVar = vec4(fillColor, fillOpacity);',
    '  strokeColorVar = vec4(strokeColor, strokeOpacity);',
    '  cornerRadiusVar = cornerRadius;',
    '  sizeVar = size;',
    '  unitVar = unit;',
    '  factorVar = max(size.x, size.y) + strokeWidth + 1.0;',
    '  positionVar = vec4(pos.xy + factorVar*unitVar - 0.5*strokeWidth - 0.5, -1.0, 1.0);',
    '  gl_Position = matrix * positionVar;',
    '}'
  ].join('\n');
  vertShader = gl.createShader(gl.VERTEX_SHADER);
  gl.shaderSource(vertShader, vertCode);
  gl.compileShader(vertShader);
  if (!gl.getShaderParameter(vertShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(vertShader);
  }

  fragCode = [
    'precision mediump float;',
    'const float PI = 3.1415926535897932384626433832795;',
    'varying vec4 fillColorVar;',
    'varying vec4 strokeColorVar;',
    'varying float strokeWidthVar;',
    'varying float cornerRadiusVar;',
    'varying float factorVar;',
    'varying vec2 unitVar;',
    'varying vec2 sizeVar;',
    'varying vec4 positionVar;',
    'uniform vec4 clip;',

    'float distToLine(vec2 pt1, vec2 pt2, vec2 testPt)',
    '{',
    '  vec2 lineDir = pt2 - pt1;',
    '  vec2 perpDir = vec2(lineDir.y, -lineDir.x);',
    '  vec2 dirToPt1 = pt1 - testPt;',
    '  return dot(normalize(perpDir), dirToPt1);',
    '}',

    'float cornerDist(vec2 pt, float radius, float xdir, float ydir, vec2 testPt)',
    '{',
    '  if (xdir * (pt.x - testPt.x) > 0.0) return 1.0;',
    '  if (ydir * (pt.y - testPt.y) > 0.0) return 1.0;',
    '  return radius - length(pt - testPt);',
    '}',

    'void main () {',
    '  if (positionVar.x < clip[0] || positionVar.x > clip[2] || positionVar.y < clip[1] || positionVar.y > clip[3]) {',
    '    discard;',
    '  }',
    '  float delta = (0.5 + 0.5*strokeWidthVar)/factorVar;',
    '  float xmax = (0.5 + 0.5*strokeWidthVar + sizeVar.x)/factorVar;',
    '  float ymax = (0.5 + 0.5*strokeWidthVar + sizeVar.y)/factorVar;',
    '  vec2 p1 = vec2(delta, delta);',
    '  vec2 p2 = vec2(xmax, delta);',
    '  vec2 p3 = vec2(xmax, ymax);',
    '  vec2 p4 = vec2(delta, ymax);',
    '  float dist = distToLine(p1, p2, unitVar);',
    '  dist = min(dist, distToLine(p2, p3, unitVar));',
    '  dist = min(dist, distToLine(p3, p4, unitVar));',
    '  dist = min(dist, distToLine(p4, p1, unitVar));',

    '  if (cornerRadiusVar > 0.0) {',
    '    delta = (0.5 + 0.5*strokeWidthVar + cornerRadiusVar)/factorVar;',
    '    xmax = (0.5 + 0.5*strokeWidthVar + sizeVar.x - cornerRadiusVar)/factorVar;',
    '    ymax = (0.5 + 0.5*strokeWidthVar + sizeVar.y - cornerRadiusVar)/factorVar;',
    '    p1 = vec2(delta, delta);',
    '    p2 = vec2(xmax, delta);',
    '    p3 = vec2(xmax, ymax);',
    '    p4 = vec2(delta, ymax);',
    '    dist = min(dist, cornerDist(p1, cornerRadiusVar/factorVar, -1.0, -1.0, unitVar));',
    '    dist = min(dist, cornerDist(p2, cornerRadiusVar/factorVar, 1.0, -1.0, unitVar));',
    '    dist = min(dist, cornerDist(p3, cornerRadiusVar/factorVar, 1.0, 1.0, unitVar));',
    '    dist = min(dist, cornerDist(p4, cornerRadiusVar/factorVar, -1.0, 1.0, unitVar));',
    '  }',

    '  dist = 1.0 - dist;',

    '  float endStep = 1.0;',
    '  float antialiasDist = 0.5 / factorVar;',
    '  float widthDist = 0.5*strokeWidthVar / factorVar;',
    '  vec4 c1;',
    '  vec4 c2;',
    '  float step;',
    '  if (dist < endStep) {',
    '    step = smoothstep(endStep - widthDist - antialiasDist, endStep - widthDist + antialiasDist, dist);',
    '    if (fillColorVar.a > 0.0) {',
    '      c1 = fillColorVar;',
    '    } else {',
    '      c1 = vec4(strokeColorVar.rgb, 0.0);',
    '    }',
    '    if (strokeWidthVar > 0.0) {',
    '      c2 = strokeColorVar;',
    '    } else {',
    '      c2 = vec4(fillColorVar.rgb, 0.0);',
    '    }',
    '  } else {',
    '    step = smoothstep(endStep + widthDist - antialiasDist, endStep + widthDist + antialiasDist, dist);',
    '    if (strokeWidthVar > 0.0) {',
    '      c1 = strokeColorVar;',
    '      c2 = vec4(strokeColorVar.rgb, 0.0);',
    '    } else {',
    '      c1 = vec4(fillColorVar.rgb, 0.0);',
    '      c2 = vec4(fillColorVar.rgb, 0.0);',
    '    }',
    '  }',
    '  gl_FragColor = mix(c1, c2, step);',
    '}'
  ].join('\n');
  fragShader = gl.createShader(gl.FRAGMENT_SHADER);
  gl.shaderSource(fragShader, fragCode);
  gl.compileShader(fragShader);
  if (!gl.getShaderParameter(fragShader, gl.COMPILE_STATUS)) {
    throw gl.getShaderInfoLog(fragShader);
  }

  shaderProgram = gl.createProgram();
  gl.attachShader(shaderProgram, vertShader);
  gl.attachShader(shaderProgram, fragShader);
  gl.linkProgram(shaderProgram);

  gl._rectShaderProgram = shaderProgram;
  gl._rectPosLocation = gl.getAttribLocation(shaderProgram, 'pos');
  gl._rectFillColorLocation = gl.getAttribLocation(shaderProgram, 'fillColor');
  gl._rectStrokeColorLocation = gl.getAttribLocation(shaderProgram, 'strokeColor');
  gl._rectFillOpacityLocation = gl.getAttribLocation(shaderProgram, 'fillOpacity');
  gl._rectStrokeWidthLocation = gl.getAttribLocation(shaderProgram, 'strokeWidth');
  gl._rectSizeLocation = gl.getAttribLocation(shaderProgram, 'size');
  gl._rectStrokeOpacityLocation = gl.getAttribLocation(shaderProgram, 'strokeOpacity');
  gl._rectCornerRadiusLocation = gl.getAttribLocation(shaderProgram, 'cornerRadius');
  gl._rectUnitLocation = gl.getAttribLocation(shaderProgram, 'unit');
  gl._rectMatrixLocation = gl.getUniformLocation(shaderProgram, 'matrix');
  gl._rectClipLocation = gl.getUniformLocation(shaderProgram, 'clip');

  return canvas;
}
