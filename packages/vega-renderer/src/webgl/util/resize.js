export var devicePixelRatio = typeof window !== 'undefined'
  ? window.devicePixelRatio || 1 : 1;

export default function(canvas, width, height, origin) {
  var scale = typeof HTMLElement !== 'undefined'
    && canvas instanceof HTMLElement
    && canvas.parentNode != null;

  var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl'),
      ratio = scale ? devicePixelRatio : 1;

  canvas.width = width * ratio;
  canvas.height = height * ratio;

  gl._textCanvas.width = width * ratio;
  gl._textCanvas.height = height * ratio;
  gl._textContext.pixelRatio = ratio;
  gl._textContext.setTransform(
    ratio, 0, 0, ratio,
    ratio * origin[0],
    ratio * origin[1]
  );

  if (ratio !== 1) {
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
  }

  gl.lineWidth(ratio);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl._origin = origin;
  gl._ratio = ratio;
  gl._clip = [0, 0, canvas.width / gl._ratio, canvas.height / gl._ratio];

  return canvas;
}
