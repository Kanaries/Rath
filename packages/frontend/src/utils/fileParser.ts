import { Record, DataSource } from '../global';
import Papa from 'papaparse';

export function csvLoader (file: File) {
  return new Promise<DataSource>((resolve, reject) => {
    Papa.parse(file, {
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
    })
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