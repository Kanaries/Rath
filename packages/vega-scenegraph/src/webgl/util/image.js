import {multiply} from './matrix';

// Adapted from https://github.com/greggman/webgl-fundamentals
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

// creates a texture info { width: w, height: h, texture: tex }
export function loadImageAndCreateTextureInfo(gl, img) {
  var tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  // Fill the texture with a 1x1 blue pixel.
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                new Uint8Array([0, 0, 255, 255]));
  // let's assume all images are not a power of 2
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  var textureInfo = {texture: tex};
  textureInfo.width = img.width;
  textureInfo.height = img.height;
  gl.bindTexture(gl.TEXTURE_2D, textureInfo.texture);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  return textureInfo;
}

export function drawImage(gl, texInfo, matrix) {
  gl.bindTexture(gl.TEXTURE_2D, texInfo.texture);
  gl.useProgram(gl._imageShaderProgram);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl._imagePositionBuffer);
  gl.enableVertexAttribArray(gl._imagePositionLocation);
  gl.vertexAttribPointer(gl._imagePositionLocation, 2, gl.FLOAT, false, 0, 0);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl._imageTexcoordBuffer);
  gl.enableVertexAttribArray(gl._imageTexcoordLocation);
  gl.vertexAttribPointer(gl._imageTexcoordLocation, 2, gl.FLOAT, false, 0, 0);
  var preMatrix = [
    texInfo.w, 0, 0, 0,
    0, texInfo.h, 0, 0,
    0, 0, 1, 0,
    texInfo.x, texInfo.y, 0, 1
  ];
  matrix = multiply(matrix, preMatrix);
  gl.uniformMatrix4fv(gl._imageMatrixLocation, false, matrix);
  gl.uniform1i(gl._imageTextureLocation, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 6);
}
