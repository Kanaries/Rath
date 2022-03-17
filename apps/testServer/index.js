var express = require("express");
var fs = require("fs");
var app = express();
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
app.use(express.json({ limit: Infinity }));

app.use(bodyParser.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: false }));

app.all("*", function (req, res, next) {
    // res.header("Access-Control-Allow-Origin", ["http://kanaries-app.s3.ap-northeast-1.amazonaws.com", "http://localhost:8000"]);
    res.header("Access-Control-Allow-Origin", '*');
    // res.header("Access-Control-Allow-Credentials", true);
    res.header(
        "Access-Control-Allow-Headers",
        "Content-Type, Content-Length, Authorization, Accept, X-Requested-With , yourHeaderFeild"
    );
    res.header("Access-Control-Allow-Methods", "PUT, POST, GET, DELETE, OPTIONS");

    if (req.method == "OPTIONS") {
        res.send(200);
        /让options请求快速返回/;
    } else {
        next();
    }
});
app.post("/associate", function (req, res) {
    // console.log("[/assocaite]", req);
    const fields = req.body.fields;
    const returns = JSON.parse(fs.readFileSync('/Users/chenhao/Downloads/result(3).json').toString())
    const result1 = returns.data.t1;
    for (let i = 0; i < result1.length; i++) {
        result1[i].dimensions = result1[i].dimensions.map(d => {
            const target = fields.find(f => f.fid.split('_')[1] === d.split('_')[1]);
            return target.fid;
        }).filter(f => Boolean(f));
        result1[i].measures = result1[i].measures.map(d => {
            const target = fields.find(f => f.fid.split('_')[1] === d.split('_')[1]);
            return target.fid;
        }).filter(f => Boolean(f));
    }
    const result2 = returns.data.t2;
    for (let i = 0; i < result2.length; i++) {
        result2[i].dimensions = result2[i].dimensions.map(d => {
            const target = fields.find(f => f.fid.split('_')[1] === d.split('_')[1]);
            return target.fid;
        }).filter(f => Boolean(f));
        result2[i].measures = result2[i].measures.map(d => {
            const target = fields.find(f => f.fid.split('_')[1] === d.split('_')[1]);
            return target.fid;
        }).filter(f => Boolean(f));
    }
    res.json(returns);
});

app.post("/start", function (req, res) {
    console.log("[/start]", req);
    const fields = req.body.fields;
    res.json({
        success: true,
        data: {
            fields: req.body.fields,
            dataSource: req.body.dataSource,
            insightSpaces: [
                {
                    dimensions: fields.filter((f) => f.analyticType === "dimension").slice(0, 2).map(f => f.fid),
                    measures: fields.filter((f) => f.analyticType === "measure").slice(0, 2).map(f => f.fid),
                    // significance: 1,
                    score: 1,
                    // impurity: 1
                },
                {
                    dimensions: fields.filter((f) => f.analyticType === "dimension").slice(1, 3).map(f => f.fid),
                    measures: fields.filter((f) => f.analyticType === "measure").slice(1, 2).map(f => f.fid),
                    // significance: 1,
                    score: 1,
                    // impurity: 1
                }
            ]
        },
    });
});

var server = app.listen(8000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("应用实例，访问地址为 http://%s:%s", host, port);
});
