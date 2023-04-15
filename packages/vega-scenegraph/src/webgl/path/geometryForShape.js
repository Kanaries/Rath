import geometryForItem from './geometryForItem';

export default function(context, item, shape, keyFunc) {
  var key = keyFunc(item), shapeGeom, val, v;

  if (context._shapeCache[key]) {
    context._shapeCacheHit++;
    return context._shapeCache[key];
  }
  context._shapeCacheMiss++;

  shapeGeom = shape(context, item);
  val = geometryForItem(context, item, shapeGeom);

  if (context._shapeCacheSize > 10000) {
    for (v in context._shapeCache) {
      if (context._shapeCache.hasOwnProperty(v)) {
        context.deleteBuffer(context._shapeCache[v].triangleBuffer);
        context.deleteBuffer(context._shapeCache[v].colorBuffer);
        context._shapeCache[v].deleted = true;
      }
    }
    context._lastColorBuffer = null;
    context._lastTriangleBuffer = null;
    context._shapeCache = {};
    context._shapeCacheSize = 0;
  }
  context._shapeCache[key] = val;
  context._shapeCacheSize++;

  return val;
}
