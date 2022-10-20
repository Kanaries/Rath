/**
 * 
 * @param {task} task is a function 
 */
export function timer (task) {
  return function (e) {
    let startTime = new Date().getTime();
    try {
      task(e);
    } finally {
      let cost = new Date().getTime() - startTime;
      // eslint-disable-next-line no-console
      console.log(`Task [${task.name}] cost ${cost} ms.`)
    }
  }
}