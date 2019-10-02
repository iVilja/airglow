export function swap(arr: number[] | Uint8ClampedArray, i: number, j: number) {
  const t = arr[i]
  arr[i] = arr[j]
  arr[j] = t
}


export type AlertType = 'primary' | 'danger' | 'success'

export type Logger = (progress: number, status: string, alertType?: AlertType) => Promise<void>

export type RGBA = [Float32Array, Float32Array, Float32Array, Float32Array]

export function getCurrentVersion(): string {
  const versionNumber = process.env.REACT_APP_VERSION!
  const tmp = window.location.pathname.split('/')
  if (tmp.length > 1) {
    const s = tmp[1]
    if (s === 'latest') {
      return s
    } else if (s.startsWith('v')) {
      const v = s.slice(1)
      if (!versionNumber.startsWith(v)) {
        return '???'
      }
    }
  }
  return versionNumber
}

export function compareVersion(a: string, b: string): number {
  if (a === 'latest') {
    return -1
  } else if (b === 'latest') {
    return 1
  }
  const regex = /^(\d+)\.(\d+)\.(\d+)$/
  const aa = a.match(regex)!
  const bb = b.match(regex)!
  for (const i of [1, 2, 3]) {
    const x = parseInt(aa[i])
    const y = parseInt(bb[i])
    if (x > y) {
      return -1
    } else if (x < y) {
      return 1
    }
  }
  return 0
}
