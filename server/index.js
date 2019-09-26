const express = require('express');
const fs = require('fs')
const path = require('path');
const bodyParser = require('body-parser');
const { fieldsAnalysis, getInsightViews } = require('../lib/build/bundle');

const app = express();
app.use(bodyParser.json({limit: '300mb'}));
app.use(bodyParser.urlencoded({limit: '300mb', extended: false}));

app.all('*',function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', true)
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.send(200);
  }
  else {
    next();
  }
});

app.get('/api/data/airbnb', function (req, res) {
  const filePath = path.resolve(__dirname, './dataset/airbnb.json');
  const data = JSON.parse(fs.readFileSync(filePath).toString())
  res.json({
    success: true,
    data
  })
})

app.get('/api/data/titanic', function (req, res) {
  const filePath = path.resolve(__dirname, './dataset/titanic.json');
  const data = JSON.parse(fs.readFileSync(filePath).toString())
  res.json({
    success: true,
    data
  })
})

app.post('/api/service/fieldsAnalysis', function (req, res) {
  console.log('[fieldsAnalysis]')
  const { dataSource, dimensions, measures } = req.body;
  const { dimScores, aggData, mapData } = fieldsAnalysis(dataSource, dimensions, measures);
  res.json({
    success: true,
    data: {
      dimScores, aggData, mapData
    }
  })
})

app.post('/api/service/getInsightViews', function (req, res) {
  console.log('[getInsightViews]')
  const { dataSource, dimensions, measures } = req.body;
  const result = getInsightViews(dataSource, dimensions, measures);
  res.json({
    success: true,
    data: result
  })
})

var server = app.listen(8000, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("应用实例，访问地址为 http://%s:%s", host, port)

})