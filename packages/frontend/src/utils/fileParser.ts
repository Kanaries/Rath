import { Record, DataSource } from '../global';
import Papa from 'papaparse';
// import datalib from 'datalib';
// import CSV from 'comma-separated-values';
export function csvLoader (file: File) {
  return new Promise<DataSource>((resolve, reject) => {
    let reader = new FileReader()
    reader.readAsText(file)
    reader.onload = (ev) => {
      if (ev.target) {
        try {
          // todo: datalib can guess the tyoe
          // const rawData: DataSource = datalib.read(ev.target.result as string, {type: 'csv', parse: 'auto'})

          // const rawData: DataSource = new CSV(ev.target.result as string, { header: true}).parse()
          let str = ev.target.result as string;
          str.replace(/[\r\n]+$/g, '\n')
          Papa.parse(ev.target.result as string, {
            complete (results, file) {
              let data: string[][] = results.data;
              let fields: string[] = data[0];
              let rawData = data.slice(1).map(row => {
                let record: Record = {};
                fields.forEach((field, index) => {
                  record[field] = row[index]
                })
                return record
              })
              resolve(rawData)
            },
            error (error, file) {
              reject(error)
            }
          });

        } catch (error) {
          reject(error)
        }
      } else {
        reject(ev)
      }
    }
    reader.onerror = reject
  })
}

export function jsonLoader (file: File): Promise<DataSource> {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.readAsText(file)
    reader.onload = (ev) => {
      if (ev.target) {
        try {
          const rawData: DataSource = JSON.parse(ev.target.result as string);
          resolve(rawData);
        } catch (error) {
          reject(error)
        }
      } else {
        reject(ev)
      }
    }
    reader.onerror = reject
  })
}