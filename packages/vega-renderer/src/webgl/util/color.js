import {color} from 'd3-color';

var cache = {};

export default function(context, item, value) {
  if (!value) {
    return [1.0, 1.0, 1.0];
  }
  if (value.id) {
    // TODO: support gradients
    return [1.0, 1.0, 1.0];
  }
  if (cache[value]) {
    return cache[value];
  }
  var rgb = color(value).rgb();
  cache[value] = [rgb.r / 255, rgb.g / 255, rgb.b / 255];
  return cache[value];
}
