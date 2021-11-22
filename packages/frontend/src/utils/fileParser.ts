import { DataSource } from '../global';

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

export function textLoader (file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    let reader = new FileReader()
    reader.readAsText(file)
    reader.onload = (ev) => {
      if (ev.target) {
        resolve(ev.target.result as string)
      } else {
        reject(ev)
      }
    }
    reader.onerror = reject
  })
}