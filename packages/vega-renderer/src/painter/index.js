import PainterHandler  from "./PainterHandler";
import PainterRenderer from "./PainterRenderer";
export * from "./util/paint";

export { PainterHandler, PainterRenderer };

export const PainterModule = {
  renderer: PainterRenderer,
  headless: PainterRenderer,
  handler:  PainterHandler,
}