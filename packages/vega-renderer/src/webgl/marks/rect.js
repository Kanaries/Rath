import {sceneVisit as visit} from 'vega-scenegraph';
import color from '../util/color';

import {Marks as marks} from 'vega-scenegraph';

function drawGL(gl, scene, bounds) {
  var unit, pos, size,
      strokeWidth, strokeOpacity, strokeColor,
      fillOpacity, fillColor, cornerRadius,
      unitBuffer, posBuffer, sizeBuffer,
      strokeWidthBuffer, strokeOpacityBuffer, strokeColorBuffer,
      fillOpacityBuffer, fillColorBuffer, cornerRadiusBuffer,
      ivpf = 0, ivpf2 = 0, ivpf3 = 0,
      numPts = scene.items.length,
      unitItem, j, anyGradients = false, ci,
      sg = scene._rectGeom;

  for (j = 0; j < scene.items.length; ++j) {
    ci = scene.items[j];
    if ((ci.stroke && ci.stroke.id) || (ci.fill && ci.fill.id)) {
      anyGradients = true;
      break;
    }
  }
  if (anyGradients) {
    marks.rect.draw(gl._textContext, scene, bounds);
    return;
  }

  if (sg && sg.numPts === numPts) {
    unit = sg.unit;
    unitBuffer = sg.unitBuffer;
    pos = sg.pos;
    size = sg.size;
    strokeWidth = sg.strokeWidth;
    strokeOpacity = sg.strokeOpacity;
    strokeColor = sg.strokeColor;
    fillOpacity = sg.fillOpacity;
    fillColor = sg.fillColor;
    cornerRadius = sg.cornerRadius;
  } else {
    if (sg) {
      gl.deleteBuffer(sg.unitBuffer);
    }
    unit = new Float32Array(6 * numPts * 2);
    pos = new Float32Array(6 * numPts * 3);
    size = new Float32Array(6 * numPts * 2);
    strokeWidth = new Float32Array(6 * numPts);
    strokeOpacity = new Float32Array(6 * numPts);
    strokeColor = new Float32Array(6 * numPts * 3);
    fillOpacity = new Float32Array(6 * numPts);
    fillColor = new Float32Array(6 * numPts * 3);
    cornerRadius = new Float32Array(6 * numPts);

    unitItem = [
      0, 1,
      1, 1,
      1, 0,
      1, 0,
      0, 0,
      0, 1
    ];
    for (j = 0; j < numPts * unitItem.length; j += 1) {
      unit[j] = unitItem[j % unitItem.length];
    }
  }

  if (sg) {
    gl.deleteBuffer(sg.posBuffer);
    gl.deleteBuffer(sg.sizeBuffer);
    gl.deleteBuffer(sg.strokeWidthBuffer);
    gl.deleteBuffer(sg.strokeOpacityBuffer);
    gl.deleteBuffer(sg.strokeColorBuffer);
    gl.deleteBuffer(sg.fillOpacityBuffer);
    gl.deleteBuffer(sg.fillColorBuffer);
    gl.deleteBuffer(sg.cornerRadiusBuffer);
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
        sx = (item.width == null ? 0 : item.width),
        sy = (item.height == null ? 0 : item.height),
        cr = (item.cornerRadius == null ? 0 : item.cornerRadius);

    for (j = 0; j < 6; j += 1, ivpf += 1, ivpf2 += 2, ivpf3 += 3) {
      pos[ivpf3] = x;
      pos[ivpf3 + 1] = y;
      pos[ivpf3 + 2] = 0;
      size[ivpf2] = sx;
      size[ivpf2 + 1] = sy;
      strokeWidth[ivpf] = sw;
      strokeOpacity[ivpf] = so;
      strokeColor[ivpf3] = sc[0];
      strokeColor[ivpf3 + 1] = sc[1];
      strokeColor[ivpf3 + 2] = sc[2];
      fillOpacity[ivpf] = fo;
      fillColor[ivpf3] = fc[0];
      fillColor[ivpf3 + 1] = fc[1];
      fillColor[ivpf3 + 2] = fc[2];
      cornerRadius[ivpf] = cr;
    }
  });

  gl.useProgram(gl._rectShaderProgram);

  if (!unitBuffer) {
    unitBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, unitBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, unit, gl.STATIC_DRAW);
    gl.vertexAttribPointer(gl._rectUnitLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl._rectUnitLocation);
  } else {
    gl.bindBuffer(gl.ARRAY_BUFFER, unitBuffer);
    gl.vertexAttribPointer(gl._rectUnitLocation, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl._rectUnitLocation);
  }

  posBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, posBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, pos, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._rectPosLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._rectPosLocation);

  sizeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, size, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._rectSizeLocation, 2, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._rectSizeLocation);

  strokeWidthBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, strokeWidthBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, strokeWidth, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._rectStrokeWidthLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._rectStrokeWidthLocation);

  strokeOpacityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, strokeOpacityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, strokeOpacity, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._rectStrokeOpacityLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._rectStrokeOpacityLocation);

  strokeColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, strokeColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, strokeColor, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._rectStrokeColorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._rectStrokeColorLocation);

  fillOpacityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fillOpacityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fillOpacity, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._rectFillOpacityLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._rectFillOpacityLocation);

  fillColorBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, fillColorBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, fillColor, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._rectFillColorLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._rectFillColorLocation);

  cornerRadiusBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, cornerRadiusBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, cornerRadius, gl.STATIC_DRAW);
  gl.vertexAttribPointer(gl._rectCornerRadiusLocation, 1, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._rectCornerRadiusLocation);

  gl.uniformMatrix4fv(gl._rectMatrixLocation, false, gl._matrix);
  gl.uniform4fv(gl._rectClipLocation, gl._clip);

  gl.drawArrays(gl.TRIANGLES, 0, numPts * 6);

  scene._rectGeom = {
    numPts: numPts,
    unit: unit,
    pos: pos,
    size: size,
    strokeWidth: strokeWidth,
    strokeOpacity: strokeOpacity,
    strokeColor: strokeColor,
    fillOpacity: fillOpacity,
    fillColor: fillColor,
    cornerRadius: cornerRadius,
    unitBuffer: unitBuffer,
    posBuffer: posBuffer,
    sizeBuffer: sizeBuffer,
    strokeWidthBuffer: strokeWidthBuffer,
    strokeOpacityBuffer: strokeOpacityBuffer,
    strokeColorBuffer: strokeColorBuffer,
    fillOpacityBuffer: fillOpacityBuffer,
    fillColorBuffer: fillColorBuffer,
    cornerRadiusBuffer: cornerRadiusBuffer
  };
}

export default {
  type:   'rect',
  drawGL: drawGL
};
