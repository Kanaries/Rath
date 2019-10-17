export function transNumber(num: any): number | null {
  if (isNaN(num)) {
    return null
  }
  return Number(num)
}