export function checkExpandEnv(): string {
  if (typeof window === 'object') {
    const url = new URL(window.location.href).searchParams.get('expand');
    if(url) {
      (window as any).ExpandEnv = url
      return url
    }
    else return ''
  }
  if (process.env.EXPAND_ENV) return process.env.EXPAND_ENV
  else return ''
}