console.log('worker')


self.addEventListener('message', function (e) {
  self.postMessage('You said: ' + e.data);
  
}, false);