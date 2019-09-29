export function swap(arr: number[] | Uint8ClampedArray, i: number, j: number) {
  const t = arr[i]
  arr[i] = arr[j]
  arr[j] = t
}


export type AlertType = 'primary' | 'danger' | 'success'

export type Logger = (progress: number, status: string, alertType?: AlertType) => Promise<void>
