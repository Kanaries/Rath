// todo replace the deepcopy with a safe and faster one.
export default function deepcopy(dataSource: any) {
  return JSON.parse(JSON.stringify(dataSource))
}