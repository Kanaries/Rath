import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import router from './router';

const app = express();
app.use(bodyParser.json({ limit: '300mb' }));
app.use(bodyParser.urlencoded({ limit: '300mb', extended: false }));

app.all('*',function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Credentials', "true")
  res.header('Access-Control-Allow-Headers', 'Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild');
  res.header('Access-Control-Allow-Methods', 'PUT, POST, GET, DELETE, OPTIONS');

  if (req.method === 'OPTIONS') {
    res.send(200);
  }
  else {
    next();
  }
});
const staticFilePath = path.resolve(__dirname, '../static');
app.use(express.static(staticFilePath))

app.get('/', function (req, res) {
  res.sendFile( staticFilePath + '/404.html' );
})

for (let i = 0; i < router.length; i++) {
  app[router[i].method](router[i].url, router[i].controller)
}


const server = app.listen(8000, function () {
  const address = server.address();
  const host = typeof address === 'string' ? address : address!.address
  const port = typeof address === 'string' ? address : address!.port

  console.log(`应用实例，访问地址为 http://${host}:${port}`)

})