import React, { useState, useEffect, useRef } from 'react';
import G2 from '@antv/g2';
function Demo(props) {
  const { dataSource, schema, dimensions, measures } = props;
  const container = useRef(null);
  // const [chart, setChart] = useState(null);
  const chart = useRef();
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
    chart.current = new G2.Chart({
      container: container.current,
      forceFit: true,
      padding: [10, 30, 100, 30],
      height: 400,
      width: window.innerWidth
    })
  }, []);

  useEffect(() => {
    if (!chart || !chart.current) return;
    const scale = {};
    ['opacity', 'shape', 'size', 'adjust&color'].filter(aestheic => typeof schema[aestheic] !== 'undefined').forEach(aestheic => {
      schema[aestheic].forEach(key => {
        scale[key] = { sync: true };
      })
    });
    position.forEach(key => {
      scale[key] = {
        sync: true,
        // hack for fucking g2 timecat rule
        // type: dimensions.includes(key) ? 'cat' : undefined
      };
    })
    console.log(scale)
    // debugger
    chart.current.source(dataSource, scale);
    ['opacity', 'shape', 'size', 'adjust&color'].filter(aestheic => typeof schema[aestheic] !== 'undefined').forEach(aestheic => {
      chart.current.legend(schema[aestheic][0], {
        title: schema[aestheic][0]
      })
    });
    if (schema.geomType && schema.geomType[0] && schema.position.length > 0) {
      chart.current.facet('rect', {
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
      chart.current.render();
    }
  });
  return <div ref={container}></div>
}

export default Demo;