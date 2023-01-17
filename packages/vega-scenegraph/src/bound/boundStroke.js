export default function(bounds, item, miter) {
  if (item.stroke && item.opacity !== 0 && item.strokeOpacity !== 0) {
    const sw = item.strokeWidth != null ? +item.strokeWidth : 1;
    bounds.expand(sw + (miter ? miterAdjustment(item, sw) : 0));
  }
  return bounds;
}

function miterAdjustment(item, strokeWidth) {
  return item.strokeJoin && item.strokeJoin !== 'miter' ? 0 : strokeWidth;
}
