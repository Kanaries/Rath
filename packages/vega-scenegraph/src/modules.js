import CanvasHandler from './CanvasHandler';
import CanvasRenderer from './CanvasRenderer';
import SVGHandler from './SVGHandler';
import SVGRenderer from './SVGRenderer';
import SVGStringRenderer from './SVGStringRenderer';
import WebGLHandler from './webgl/WebGLHandler';
import WebGLRenderer from './webgl/WebGLRenderer';
import PainterHandler from './painter/PainterHandler';
import PainterRenderer from './painter/PainterRenderer';

const Canvas = 'canvas';
const PNG = 'png';
const SVG = 'svg';
const None = 'none';
const WebGL = 'webgl';
const Painter = 'painter';

export const RenderType = {
  Canvas: Canvas,
  PNG:    PNG,
  SVG:    SVG,
  None:   None,
  WebGL:  WebGL,
  Painter: Painter
};

const modules = {};

modules[Canvas] = modules[PNG] = {
  renderer: CanvasRenderer,
  headless: CanvasRenderer,
  handler:  CanvasHandler
};

modules[SVG] = {
  renderer: SVGRenderer,
  headless: SVGStringRenderer,
  handler:  SVGHandler
};

modules[WebGL] = {
  renderer: WebGLRenderer,
  headless: WebGLRenderer,
  handler:  WebGLHandler
};

modules[Painter] = {
  renderer: PainterRenderer,
  headless: PainterRenderer,
  handler:  PainterHandler
};

modules[None] = {};

export function renderModule(name, _) {
  name = String(name || '').toLowerCase();
  if (arguments.length > 1) {
    modules[name] = _;
    return this;
  } else {
    return modules[name];
  }
}
