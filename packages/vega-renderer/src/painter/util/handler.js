import { point } from 'vega-scenegraph';
import { TouchEndEvent, TouchMoveEvent, TouchStartEvent } from './events';
import { isArray } from "vega-util";
import { testConfig } from '@kanaries/rath-utils';

const eventBundle = (type) => ((
  type === TouchStartEvent ||
  type === TouchMoveEvent ||
  type === TouchEndEvent
)
? [TouchStartEvent, TouchMoveEvent, TouchEndEvent]
: [type]);

// lazily add listeners to the canvas as needed
function eventListenerCheck(handler, type) {
  eventBundle(type).forEach(_ => addEventListener(handler, _));
}

function addEventListener(handler, type) {
  const canvas = handler.canvas();
  if (canvas && !handler._events[type]) {
    handler._events[type] = 1;
    canvas.addEventListener(type, handler[type]
      ? evt => handler[type](evt)
      : evt => handler.fire(type, evt)
    );
  }
}

function move(moveEvent, overEvent, outEvent) {
  return function(evt) {
    const a = this._active,
          p = this.pickEvent(evt);

    if (p === a) {
      // active item and picked item are the same
      this.fire(moveEvent, evt); // fire move
    } else {
      // active item and picked item are different
      if (!a || !a.exit) {
        // fire out for prior active item
        // suppress if active item was removed from scene
        this.fire(outEvent, evt);
      }
      // console.log("fired event", p, evt);
      this._active = p;          // set new active item
      this.fire(overEvent, evt); // fire over for new active item
      this.fire(moveEvent, evt); // fire move for new active item
    }
  };
}

function inactive(type) {
  return function(evt) {
    this.fire(type, evt);
    this._active = null;
  };
}

/**
 * show event
 * depends on `this`, should only be used as object methods
 * @param {(evt: Event) => any} handler
 * @returns 
 */
function showEvent(handler) {
  return function(evt) {
    if (testConfig.printLog) {
      console.log("ev:", evt);
    }
    return handler.call(this, evt);
  }
}

/**
 * merge several event handlers
 * @param  {...(evt: Event)=>any} handlers 
 * @returns 
 */
function union(...handlers) {
  return function(evt) {
    for (let i = 0; i < handlers.length; ++i) {
      handlers[i].call(this, evt);
    }
  };
}

/**
 * 
 * depends on `this`, should only be used as object methods
 * @param  {...(handler: function(Event): any) => (function(Event): any)} middlewares 
 * @returns (evt: Event)=>any
 */
function pipe(...middlewares) {
  return function(handler) {
    let next = handler;
    for (let i = middlewares.length - 1; i >= 0; --i) {
      next = m(next);
    }
    return next;
  }
}

/**
 * depends on `this`, should only be used as object methods
 * @param {*} type 
 * @returns 
 */
function gl_evt(type) {
  return function(evt) {
    type = type || evt.type;
    const h = this._handlers[`gl_${type}`];
    const p = point(evt, this._canvas);
    const o = this._origin;
    [evt._x, evt._y] = p;
    [evt._ox, evt._oy] = o;
    evt._renderer = this._obj._renderer
    if (h && isArray(h)) {
      for (let i = 0; i < h.length; ++i) {
        h[i].handler.call(this._obj, evt, this._obj._renderer, this._active, this._touch);
      }
    }
  }
}

export {eventBundle, eventListenerCheck, move, inactive, showEvent, union, pipe, gl_evt}