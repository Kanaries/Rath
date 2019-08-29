import React, { useEffect } from 'react';
import G2 from '@antv/g2';
function Demo(props) {
  const { dataSource, schema } = props;
  console.log(dataSource, schema)
  const {
    position,
    size,
    opacity,
    shape,
    geomType,
    'adjust&color': color,
    facets = []
  } = schema;
  useEffect(() => {
    const chart = new G2.Chart({
      container: 'g2-demo',
      forceFit: true,
      padding: [100, 300, 100, 300],
      height: window.innerHeight
    });
    const scale = {};
    Object.keys(dataSource[0]).forEach(key => {
      scale[key] = { sync: true };
    })
    chart.source(dataSource, scale);
    chart.facet('rect', {
      fields: facets,
      eachView (view) {
        let geom = view[schema.geomType[0]]();
        geom.position(schema.position);
        if (color) {
          geom.color(color[0]).adjust([{
            type: 'stack',
            // marginRatio: 1 / 32
          }])
        }
        if (schema.geomType[0] !== 'interval') {
          ['opacity', 'shape', 'size'].filter(aesthic => typeof schema[aesthic] !== 'undefined').forEach(aestheic => {
            geom[aestheic](schema[aestheic][0]);
          });
        }
      }
    });
    chart.render();
  });
  return <div id="g2-demo"></div>
}

export default Demo;