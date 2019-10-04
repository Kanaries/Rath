const concurrently = require('concurrently');
concurrently([
  {
    name: 'server',
    command: 'yarn workspace backend dev',
    prefix: '{time}-{pid}',
    prefixColor: 'red'
  },
  {
    name: 'UI',
    command: 'yarn workspace frontend start'
  },
  // {
  //   prefix: 'exit process',
  //   killOthers: ['yarn workspace backend dev', 'yarn workspace frontend start']
  // }
]).then((value) => {
  console.log(value)
}, (reason) => {
  console.error(reason)
});