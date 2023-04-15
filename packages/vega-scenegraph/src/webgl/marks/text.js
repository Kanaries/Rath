import text from '../../marks/text'


function drawGL(context, scene, bounds) {
  text.draw(context._textContext, scene, bounds);
}

export default {
  type:   'text',
  drawGL: drawGL
};
