import { IMuteFieldBase, IRow } from "../interfaces"

const DATA_SOURCE_LOGGER_URL =
  'https://1423108296428281.cn-hangzhou.fc.aliyuncs.com/2016-08-15/proxy/Rath/dataSourceLogger/'

interface IDataImportInfo {
    dataType: string;
    fields: IMuteFieldBase[];
    dataSource: IRow[];
    name?: string;
    info?: any;
    size: number;
}
export async function logDataImport (props: IDataImportInfo) {
    if (process.env.NODE_ENV === 'production') {
        try {
          const res = await fetch(DATA_SOURCE_LOGGER_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(props),
          })
          await res.json()
        } catch (error) {
          console.error(error)
        }
    } else {
        // eslint-disable-next-line no-console
        console.log(`Current Env: ${process.env.NODE_ENV}.`, props);
    }
}

export async function dataBackup (file: File) {
  if (process.env.NODE_ENV === 'production') {
    const data = new FormData();
    data.append('file', file);
    const url = `//kanaries.${window.location.hostname.includes('kanaries.cn') ? 'cn' : 'net'}/api/ce/uploadDataset`;
    fetch(url, {
      method: 'POST',
      credentials: 'include',
      body: data
    }).then(res => res.json()).catch(err => {
      console.warn(err)
    })
  } else {
    // eslint-disable-next-line no-console
    console.log(file)
  }
}