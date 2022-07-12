import React, { useEffect, useRef } from 'react';
import { View, parse } from 'vega';
import { compile } from 'vega-lite';

const VegaVis: React.FC = props => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const canvasRefOff = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
        if (canvasRef.current) {
            const vegaSpec = compile({
                "data": {
                  "values": [
                    {
                      "Name": "plymouth duster",
                      "Miles_per_Gallon": 22,
                      "Cylinders": 6,
                      "Displacement": 198,
                      "Horsepower": 95,
                      "Weight_in_lbs": 2833,
                      "Acceleration": 15.5,
                      "Year": "1970-01-01",
                      "Origin": "USA"
                    },
                    {
                      "Name": "plymouth duster",
                      "Miles_per_Gallon": 23,
                      "Cylinders": 6,
                      "Displacement": 198,
                      "Horsepower": 95,
                      "Weight_in_lbs": 2904,
                      "Acceleration": 16,
                      "Year": "1973-01-01",
                      "Origin": "USA"
                    }
                  ]
                },
                "mark": {"type": "bar", "tooltip": true, "opacity": 0.88},
                "encoding": {
                  "x": {
                    "field": "Weight_in_lbs",
                    "type": "quantitative",
                    "title": "Weight_in_lbs",
                    "bin": true
                  },
                  "y": {"aggregate": "count"}
                }
              })
            const view = new View(parse(vegaSpec.spec), {
                renderer: 'none'
            })
            console.log(view)
            // view.runAsync().then(resView => {
            //     if (canvasRef.current && canvasRefOff.current) {
            //         var offscreen = new OffscreenCanvas(256, 256);
            //         const ctx = canvasRefOff.current.getContext('2d')
            //         return resView.toCanvas(1, {
            //             externalContext: ctx
            //         })
            //     }
            // }).then(() => {
            //     // console.log('ctx', ctx)
            //     if (canvasRef.current && canvasRefOff.current) {
            //         const offctx = canvasRefOff.current.getContext('2d')
            //         const ctx = canvasRef.current.getContext('2d')
            //         offctx.
            //         ctx?.scale(0.01, 0.01)
            //     }
            //     // if (canvasRef.current) {
            //     //     canvasRef.current.render
            //     // }
            // });


        }
        // console.log(res);
    }, [])
    return <div>
        <canvas width={400} height={400} ref={canvasRef}></canvas>
        <canvas width={400} height={400} ref={canvasRefOff}></canvas>
    </div>
}

export default VegaVis;