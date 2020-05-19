import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import router from './router';
import fs from 'fs';
import http from 'http';
import https from 'https';
import morgan from 'morgan';

const privateKey  = fs.readFileSync(path.resolve(__dirname, '../safety/lobay.moe.key'), 'utf8');
const certificate = fs.readFileSync(path.resolve(__dirname, '../safety/lobay.moe.cer'), 'utf8');
const credentials = {key: privateKey, cert: certificate};
const httpPort = 8000;
const httpsPort = 8443;

const app = express();

app.use(morgan('short'))
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


const httpServer = http.createServer(app);
const httpsServer = https.createServer(credentials, app);

httpServer.listen(httpPort, () => {
  console.log(`server is running on http://0.0.0.0:${httpPort}`)
});
httpsServer.listen(httpsPort, () => {
  console.log(`server is running on https://0.0.0.0:${httpsPort}`)
});