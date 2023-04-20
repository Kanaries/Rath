import {WebGLHandler} from '../webgl';
import {point, domFind, Marks} from 'vega-scenegraph';

import {
  ClickEvent, DragEnterEvent, DragLeaveEvent, DragOverEvent, Events,
  HrefEvent, MouseDownEvent, MouseMoveEvent, MouseOutEvent, MouseOverEvent,
  MouseWheelEvent, TooltipHideEvent, TooltipShowEvent,
  TouchEndEvent, TouchMoveEvent, TouchStartEvent
} from './util/events';
import {
  eventBundle, eventListenerCheck, move, inactive, showEvent, union, pipe, gl_evt
} from './util/handler'
import { isArray } from "vega-util";
import { testConfig } from "@kanaries/rath-utils";

Events.push(
  ... [ClickEvent, MouseDownEvent, MouseMoveEvent, MouseOutEvent, DragLeaveEvent]
    .map(ev => `gl_${ev}`)
)

/**
 * @class PainterHandler
 * @param {Loader} customLoader
 * @param {Tooltip} customTooltip
 * @constructor PainterHandler
 * 
 * @event PainterHandler#click
 * @event PainterHandler#move
 */
class PainterHandler extends WebGLHandler {
  constructor(customLoader, customTooltip) {
    if (testConfig.printLog) {
      console.log('PainterHandler())', customLoader, customTooltip);
    }
    super(customLoader, customTooltip);
  }
  /**
   * 
   * @param {HTMLElement} el 
   * @param {[number, number]} origin 
   * @param {View} obj 
   * @returns 
   */
  initialize(el, origin, obj) {
    if (testConfig.printLog) {
      console.log('PainterHandler.initialize()', el, origin, obj);
    }
    // build here
    const init = super.initialize(el, origin, obj);
    return init;
  }
  context() {
    return super.context();
  }

  pickEvent(evt) {
    const p = point(evt, this._canvas),
          o = this._origin;
    return this.pick(this._scene, p[0], p[1], p[0] - o[0], p[1] - o[1]);
  }

  // find the scenegraph item at the current mouse position
  // x, y -- the absolute x, y mouse coordinates on the canvas element
  // gx, gy -- the relative coordinates within the current group
  pick(scene, x, y, gx, gy) {
    const g = this.context(),
          mark = Marks[scene.marktype];
    return mark.pick.call(this, g, scene, x, y, gx, gy);
  }

  // on(type, handler) {
  // }
  // off(type, handler) {
  // }

  // to keep old versions of firefox happy
  DOMMouseScroll(evt) {
    this.fire(MouseWheelEvent, evt);
  }

  mousemove = union(gl_evt(MouseMoveEvent), move(MouseMoveEvent, MouseOverEvent, MouseOutEvent));
  dragover  = union(gl_evt(DragOverEvent), move(DragOverEvent, DragEnterEvent, DragLeaveEvent));
  mouseout  = union(gl_evt(MouseOutEvent), inactive(MouseOutEvent));
  dragleave = union(gl_evt(DragLeaveEvent), inactive(DragLeaveEvent));

  mousedown = union(gl_evt(MouseDownEvent), function(evt) {
    this._down = this._active;
    // console.log("Canvas mousedown", this);
    this.fire(MouseDownEvent, evt);
  });

  click = union(gl_evt(ClickEvent), (evt) => {

    if (this._down === this._active) {
      this.fire(ClickEvent, evt);
      this._down = null;
    }
  });

  touchstart = union(gl_evt(TouchStartEvent), super.touchstart)

  touchmove = union(gl_evt(TouchMoveEvent), super.touchmove);

  touchend = union(gl_evt(TouchEndEvent), super.touchend);

  // fire an event
  fire(type, evt, touch) {
    const a = touch ? this._touch : this._active,
          h = this._handlers[type];

    // set event type relative to scenegraph items
    evt.vegaType = type;

    // handle hyperlinks and tooltips first
    if (type === HrefEvent && a && a.href) {
      this.handleHref(evt, a, a.href);
    } else if (type === TooltipShowEvent || type === TooltipHideEvent) {
      if (this._obj._renderer.isPainting) type = TooltipHideEvent; // hide it when painting
      this.handleTooltip(evt, a, type !== TooltipHideEvent);
    }

    // invoke all registered handlers
    if (h) {
      for (let i=0, len=h.length; i<len; ++i) {
        h[i].handler.call(this._obj, evt, a);
      }
    }
  }

  // add an event handler
  on(type, handler) {
    const name = this.eventName(type),
          h = this._handlers,
          i = this._handlerIndex(h[name], type, handler);

    if (i < 0) {
      eventListenerCheck(this, type);
      (h[name] || (h[name] = [])).push({
        type:    type,
        handler: handler
      });
    }

    return this;
  }

  // remove an event handler
  off(type, handler) {
    const name = this.eventName(type),
          h = this._handlers[name],
          i = this._handlerIndex(h, type, handler);

    if (i >= 0) {
      h.splice(i, 1);
    }

    return this;
  }
}

export default PainterHandler;