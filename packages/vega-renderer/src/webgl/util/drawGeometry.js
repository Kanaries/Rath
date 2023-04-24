export default function(geom, gl, item) {
  var opacity = item.opacity == null ? 1 : item.opacity,
      tx = gl._tx + gl._origin[0],
      ty = gl._ty + gl._origin[1];

  if (opacity <= 0) return;
  if (geom.numTriangles === 0) return;

  gl.useProgram(gl._shaderProgram);

  gl.bindBuffer(gl.ARRAY_BUFFER, geom.triangleBuffer);
  gl.vertexAttribPointer(gl._coordLocation, 3, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._coordLocation);
  gl._lastTriangleBuffer = geom.triangleBuffer;

  gl.bindBuffer(gl.ARRAY_BUFFER, geom.colorBuffer);
  gl.vertexAttribPointer(gl._colorLocation, 4, gl.FLOAT, false, 0, 0);
  gl.enableVertexAttribArray(gl._colorLocation);
  gl._lastColorBuffer = geom.colorBuffer;

  gl.uniform2fv(gl._offsetLocation, [tx, ty]);
  gl.uniform4fv(gl._clipLocation, gl._clip);

  gl.drawArrays(gl.TRIANGLES, 0, geom.numTriangles * 3);
}
