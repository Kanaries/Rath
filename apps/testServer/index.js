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
    console.log("[/assocaite]", req);
    const fields = req.body.fields;
    res.json({
        success: true,
        data: {
            t1: [
                {
                    dimensions: fields
                        .filter((f) => f.analyticType === "dimension")
                        .slice(0, 1)
                        .map((f) => f.fid),
                    measures: fields
                        .filter((f) => f.analyticType === "measure")
                        .slice(0, 1)
                        .map((f) => f.fid),
                    score: 2,
                },
                {
                    dimensions: fields
                        .filter((f) => f.analyticType === "dimension")
                        .slice(1, 2)
                        .map((f) => f.fid),
                    measures: fields
                        .filter((f) => f.analyticType === "measure")
                        .slice(1, 2)
                        .map((f) => f.fid),
                    score: 1,
                },
            ],
            t2: [],
        },
    });
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
