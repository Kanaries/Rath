import {CanvasHandler} from 'vega-scenegraph';
import inherits from './util/inherits';

// Patch CanvasHandler
export default function WebGLHandler(loader, tooltip) {
  CanvasHandler.call(this, loader, tooltip);
}
var prototype = inherits(WebGLHandler, CanvasHandler);
prototype.context = function() {
  return this._canvas.getContext('2d') || this._canvas._textCanvas.getContext('2d');
};
