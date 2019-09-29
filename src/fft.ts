import { irfft2d, rfft2d } from 'kissfft-wasm'

import { RGBA } from './utils'


function splitRGBA(data: Uint8ClampedArray): RGBA {
  const n = data.length / 4
  const r = new Float32Array(n)
  const g = new Float32Array(n)
  const b = new Float32Array(n)
  const a = new Float32Array(n)

  for (let i = 0; i < n; i++) {
    r[i] = data[4 * i]
    g[i] = data[4 * i + 1]
    b[i] = data[4 * i + 2]
    a[i] = data[4 * i + 3]
  }

  return [r, g, b, a]
}

function mergeRGBA([r, g, b, a]: RGBA): Uint8ClampedArray {
  const n = r.length
  const output = new Uint8ClampedArray(n * 4)

  for (let i = 0; i < n; i++) {
    output[4 * i] = r[i]
    output[4 * i + 1] = g[i]
    output[4 * i + 2] = b[i]
    output[4 * i + 3] = a[i]
  }

  return output
}

export function fft2Image(image: ImageData): RGBA {
  const [r, g, b, a] = splitRGBA(image.data)
  const nx = image.width
  const ny = image.height

  return [
    rfft2d(r, nx, ny),
    rfft2d(g, nx, ny),
    rfft2d(b, nx, ny),
    a
  ]
}

export function ifft2Image([rf, gf, bf, a]: RGBA, width: number, height: number): ImageData {
  const r = irfft2d(rf, width, height)
  const g = irfft2d(gf, width, height)
  const b = irfft2d(bf, width, height)
  const result = mergeRGBA([r, g, b, a])
  return new ImageData(result, width, height)
}
