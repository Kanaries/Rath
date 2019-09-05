import React, { useState, useEffect, useRef } from 'react';
import G2 from '@antv/g2';
function Demo(props) {
  const { dataSource, schema } = props;
  const container = useRef(null);
  const [chart, setChart] = useState(null);
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
    setChart(() => {
      return new G2.Chart({
        container: container.current,
        // forceFit: true,
        padding: [10, 30, 10, 30],
        height: 400,
        width: 600
      })
    })
  }, []);

  useEffect(() => {
    if (chart === null) return;
    const scale = {};
    position.forEach(key => {
      scale[key] = { sync: true };
    })
    chart.source(dataSource, scale);
    ['opacity', 'shape', 'size', 'adjust&color'].filter(aestheic => typeof schema[aestheic] !== 'undefined').forEach(aestheic => {
      chart.legend(schema[aestheic][0], {
        title: schema[aestheic][0]
      })
    });
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
  return <div ref={container}></div>
}

export default Demo;