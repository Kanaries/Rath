const express = require('express');
const fs = require('fs')
const path = require('path');
const app = express();

app.all('*',function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method == 'OPTIONS') {
    res.send(200);
  }
  else {
    next();
  }
});

app.get('/api/airbnb', function (req, res) {
  const filePath = path.resolve(__dirname, './dataset/airbnb.json');
  const data = JSON.parse(fs.readFileSync(filePath).toString())
  res.json({
    success: true,
    data
  })
})

var server = app.listen(8000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("应用实例，访问地址为 http://%s:%s", host, port)

})