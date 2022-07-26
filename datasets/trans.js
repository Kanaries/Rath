const fs = require('fs');
const moment = require('moment');
const originData = JSON.parse(fs.readFileSync('./ds_btc_gold_service.json').toString())

let dataSource = originData.dataSource;
for (let i = 0; i < dataSource.length; i++) {
    dataSource[i].Month = Number(dataSource[i].Month);
    dataSource[i].Day = Number(dataSource[i].Day);
    dataSource[i].Year = Number(dataSource[i].Year);
    dataSource[i]['BitcoinPerGold'] = dataSource[i].BitcoinPrice / dataSource[i].GoldPrice;
    if (i > 0) {
        let lastDay = moment(dataSource[i - 1].Date);
        let today = moment(dataSource[i].Date)
        let diffDays = today.diff(lastDay, 'days')
        console.log(diffDays)
        dataSource[i]['△BitcoinPrice/△Date'] = (dataSource[i].BitcoinPrice - dataSource[i - 1].BitcoinPrice) / (diffDays)
        dataSource[i]['△GoldPrice/△Date'] = (dataSource[i].GoldPrice - dataSource[i - 1].GoldPrice) / (diffDays)
    } else {
        dataSource[i]['△BitcoinPrice/△Date'] = 0
        dataSource[i]['△GoldPrice/△Date'] = 0
    }
}
originData.fields.push({
    fid: '△BitcoinPrice/△Date',
    analyticType: 'measure',
    semanticType: 'quantitative'
}, {
    fid: '△GoldPrice/△Date',
    analyticType: 'measure',
    semanticType: 'quantitative'
})
fs.writeFileSync('./demo.json', JSON.stringify(originData))