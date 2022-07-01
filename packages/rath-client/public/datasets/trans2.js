const fs = require('fs');
const originData = JSON.parse(fs.readFileSync('./ds-bikesharing-service-old.json').toString())

let dataSource = originData.dataSource;
for (let i = 0; i < dataSource.length; i++) {
    const res = /([0-9]+):[0-9]+:[0-9]+/.exec(dataSource[i].col_1_33)
    // console.log(res[0])
    dataSource[i].col_1_33 = Number(res[1]);
}
fs.writeFileSync('./ds-bikesharing-service.json', JSON.stringify(originData))