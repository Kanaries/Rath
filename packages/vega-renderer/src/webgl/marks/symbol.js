import {sceneVisit as visit} from 'vega-scenegraph';
import color from '../util/color';

function drawGL(gl, scene) {
  var unit, pos, size, shape,
      strokeWidth, strokeOpacity, strokeColor,
      fillOpacity, fillColor,
      unitBuffer, posBuffer, sizeBuffer, shapeBuffer,
      strokeWidthBuffer, strokeOpacityBuffer, strokeColorBuffer,
      fillOpacityBuffer, fillColorBuffer,
      ivpf = 0, ivpf3 = 0,
      numPts = scene.items.length,
      xu = 0, yu = 0, w = 1, h = 1, j, unitItem,
      sg = scene._symbolGeom, shapeIndex;

  if (numPts === 0) {
    return;
  }

  shapeIndex = {
    circle: 0,
    cross: 1,
    diamond: 2,
    square: 3,
    star: 4,
    triangle: 5,
    'triangle-up': 5,
    'triangle-right': 6,
    'triangle-down': 7,
    'triangle-left': 8,
    wye: 9
  };

  if (sg && sg.numPts === numPts) {
    unit = sg.unit;
    unitBuffer = sg.unitBuffer;
    pos = sg.pos;
    size = sg.size;
    shape = sg.shape;
    strokeWidth = sg.strokeWidth;
    strokeOpacity = sg.strokeOpacity;
    strokeColor = sg.strokeColor;
    fillOpacity = sg.fillOpacity;
    fillColor = sg.fillColor;
  } else {
    if (sg) {
      gl.deleteBuffer(sg.unitBuffer);
    }
    unit = new Float32Array(3 * numPts * 2);
    pos = new Float32Array(3 * numPts * 3);
    size = new Float32Array(3 * numPts);
    shape = new Float32Array(3 * numPts);
    strokeWidth = new Float32Array(3 * numPts);
    strokeOpacity = new Float32Array(3 * numPts);
    strokeColor = new Float32Array(3 * numPts * 3);
    fillOpacity = new Float32Array(3 * numPts);
    fillColor = new Float32Array(3 * numPts * 3);

    unitItem = [
      xu, yu - h * 2,
      xu - w * Math.sqrt(3.0), yu + h,
      xu + w * Math.sqrt(3.0), yu + h
    ];
    for (j = 0; j < numPts * unitItem.length; j += 1) {
      unit[j] = unitItem[j % unitItem.length];
    }
  }

  if (sg) {
    gl.deleteBuffer(sg.posBuffer);
    gl.deleteBuffer(sg.sizeBuffer);
    gl.deleteBuffer(sg.shapeBuffer);
    gl.deleteBuffer(sg.strokeWidthBuffer);
    gl.deleteBuffer(sg.strokeOpacityBuffer);
    gl.deleteBuffer(sg.strokeColorBuffer);
    gl.deleteBuffer(sg.fillOpacityBuffer);
    gl.deleteBuffer(sg.fillColorBuffer);
  }

  visit(scene, function(item) {
    var x = (item.x || 0) + gl._tx + gl._origin[0],
        y = (item.y || 0) + gl._ty + gl._origin[1],
        fc = color(gl, item, item.fill),
        sc = color(gl, item, item.stroke),
        op = item.opacity == null ? 1 : item.opacity,
        fo = op * ((item.fill == null || item.fill == 'transparent') ? 0 : 1) * (item.fillOpacity == null ? 1 : item.fillOpacity),
        so = op * ((item.stroke == null || item.stroke == 'transparent') ? 0 : 1) * (item.strokeOpacity == null ? 1 : item.strokeOpacity),
        sw = ((item.stroke == null || item.stroke == 'transparent') ? 0 : 1) * (item.strokeWidth == null ? 1 : item.strokeWidth),
        sz = (item.size == null ? 64 : item.size),
        sh = shapeIndex[item.shape] == undefined ? 0 : shapeIndex[item.shape];

    for (j = 0; j < 3; j += 1, ivpf += 1, ivpf3 += 3) {
      pos[ivpf3] = x;
      pos[ivpf3 + 1] = y;
      pos[ivpf3 + 2] = 0;
      size[ivpf] = sz;
      strokeWidth[ivpf] = sw;
      shape[ivpf] = sh;
      strokeOpacity[ivpf] = so;
      strokeColor[ivpf3] = sc[0];
      strokeColor[ivpf3 + 1] = sc[1];
      strokeColor[ivpf3 + 2] = sc[2];
      fillOpacity[ivpf] = fo;
      fillColor[ivpf3] = fc[0];
      fillColor[ivpf3 + 1] = fc[1];
      fillColor[ivpf3 + 2] = fc[2];
    }
  });

  gl.useProgram(gl._symbolShaderProgram);

  if (!unitBuffer) {
    unitBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, unitBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, unit, gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl._symbolUnitLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl._symbolUnitLocation);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, unitBuffer);
    gl.vertexAttribPointer(gl._symbolUnitLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl._symbolUnitLocation);
  }

  posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._symbolPosLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._symbolPosLocation);

  sizeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, size, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._symbolSizeLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._symbolSizeLocation);

  shapeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, shapeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, shape, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._symbolShapeLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._symbolShapeLocation);

  strokeWidthBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, strokeWidthBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, strokeWidth, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._symbolStrokeWidthLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._symbolStrokeWidthLocation);

  strokeOpacityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, strokeOpacityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, strokeOpacity, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._symbolStrokeOpacityLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._symbolStrokeOpacityLocation);

  strokeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, strokeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, strokeColor, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._symbolStrokeColorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._symbolStrokeColorLocation);

  fillOpacityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fillOpacityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fillOpacity, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._symbolFillOpacityLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._symbolFillOpacityLocation);

  fillColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fillColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fillColor, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._symbolFillColorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._symbolFillColorLocation);

  gl.uniformMatrix4fv(gl._symbolMatrixLocation, false, gl._matrix);
  gl.uniform4fv(gl._symbolClipLocation, gl._clip);

  gl.drawArrays(gl.TRIANGLES, 0, numPts * 3);

  scene._symbolGeom = {
    numPts: numPts,
    unit: unit,
    pos: pos,
    size: size,
    shape: shape,
    strokeWidth: strokeWidth,
    strokeOpacity: strokeOpacity,
    strokeColor: strokeColor,
    fillOpacity: fillOpacity,
    fillColor: fillColor,
    unitBuffer: unitBuffer,
    posBuffer: posBuffer,
    sizeBuffer: sizeBuffer,
    shapeBuffer: shapeBuffer,
    strokeWidthBuffer: strokeWidthBuffer,
    strokeOpacityBuffer: strokeOpacityBuffer,
    strokeColorBuffer: strokeColorBuffer,
    fillOpacityBuffer: fillOpacityBuffer,
    fillColorBuffer: fillColorBuffer
  };
}

export default {
  type:   'symbol',
  drawGL: drawGL
};
