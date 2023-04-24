import parse from 'parse-svg-path';
import simplify from 'simplify-path';
import contours from 'svg-path-contours';
import triangulate from 'triangulate-contours';

export default function(context, path, threshold) {
  var key = path;
  if (context._pathCache[key]) {
    context._pathCacheHit++;
    return context._pathCache[key];
  }
  context._pathCacheMiss++;

  threshold = threshold || 1.0;
  if (!path) {
    return {lines: [], triangles: [], closed: false, z: 0};
  }

  // get a list of polylines/contours from svg contents
  var lines = contours(parse(path)), tri;

  // simplify the contours before triangulation
  lines = lines.map(function(path) {
    return simplify(path, threshold);
  });

  // triangluate can fail in some corner cases
  try {
    tri = triangulate(lines);
  }
  catch(e) {
    // console.log('Could not triangulate the following path:');
    // console.log(path);
    // console.log(e);
    tri = {positions: [], cells: []};
  }

  var z = context._randomZ ? 0.25*(Math.random() - 0.5) : 0;

  var triangles = [];
  var tcl = tri.cells.length,
      tc = tri.cells,
      tp = tri.positions;
  for (var ci = 0; ci < tcl; ci++) {
    var cell = tc[ci];
    var p1 = tp[cell[0]];
    var p2 = tp[cell[1]];
    var p3 = tp[cell[2]];
    triangles.push(p1[0], p1[1], z, p2[0], p2[1], z, p3[0], p3[1], z);
  }

  var geom = {
    lines: lines,
    triangles: triangles,
    closed: path.endsWith('Z'),
    z: z,
    key: key
  };

  context._pathCache[key] = geom;
  context._pathCacheSize++;
  if (context._pathCacheSize > 10000) {
    context._pathCache = {};
    context._pathCacheSize = 0;
  }
  return geom;
}
