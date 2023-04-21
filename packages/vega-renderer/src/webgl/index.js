import WebGLHandler  from "./WebGLHandler";
import WebGLRenderer from "./WebGLRenderer";

export { WebGLHandler, WebGLRenderer };

export const WebGLModule = {
  renderer: WebGLRenderer,
  headless: WebGLRenderer,
  handler: WebGLHandler,
}