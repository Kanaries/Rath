import { BIField, Record } from "../global"

const DATA_SOURCE_LOGGER_URL =
  'https://1423108296428281.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/Rath/dataSourceLogger/'


export async function logDataImport (fields: BIField[], dataSource: Record[]) {
    const loggerBody = {
        fields,
        dataSource: dataSource.slice(0, 10),
    };
    if (process.env.NODE_ENV === 'production') {
        try {
          const res = await fetch(DATA_SOURCE_LOGGER_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(loggerBody),
          })
          const result = await res.json()
          console.log(result)
        } catch (error) {
          console.error(error)
        }
    } else {
        console.log(`Current Env: ${process.env.NODE_ENV}.`, loggerBody);
    }
}