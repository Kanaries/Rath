import PainterHandler  from "./PainterHandler";
import PainterRenderer from "./PainterRenderer";

export { PainterHandler, PainterRenderer };

export const PainterModule = {
  renderer: PainterRenderer,
  headless: PainterRenderer,
  handler:  PainterHandler,
}