import { ComplexArray } from 'jsfft'

function splitRGBA(data: Uint8ClampedArray): [Uint8ClampedArray, Uint8ClampedArray, Uint8ClampedArray, Uint8ClampedArray] {
  const n = data.length / 4
  const r = new Uint8ClampedArray(n)
  const g = new Uint8ClampedArray(n)
  const b = new Uint8ClampedArray(n)
  const a = new Uint8ClampedArray(n)

  for (let i = 0; i < n; i++) {
    r[i] = data[4 * i]
    g[i] = data[4 * i + 1]
    b[i] = data[4 * i + 2]
    a[i] = data[4 * i + 3]
  }

  return [r, g, b, a]
}

function mergeRGBA(r: ComplexArray, g: ComplexArray, b: ComplexArray, a: Uint8ClampedArray) {
  const n = r.length
  const output = new ComplexArray(n * 4, Float32Array)

  for (let i = 0; i < n; i++) {
    output.real[4 * i] = r.real[i]
    output.imag[4 * i] = r.imag[i]
    output.real[4 * i + 1] = g.real[i]
    output.imag[4 * i + 1] = g.imag[i]
    output.real[4 * i + 2] = b.real[i]
    output.imag[4 * i + 2] = b.imag[i]
    output.real[4 * i + 3] = a[i]
    output.imag[4 * i + 3] = 0
  }

  return output
}

function fft2(input: ComplexArray, nx: number, ny: number): ComplexArray {
  const output = new ComplexArray(input.length, Float32Array)
  const row = new ComplexArray(nx, Float32Array)
  for (let j = 0; j < ny; j++) {
    row.map((v, i) => {
      v.real = input.real[i + j * nx]
      v.imag = input.imag[i + j * nx]
    })
    row.FFT().forEach((v, i) => {
      output.real[i + j * nx] = v.real
      output.imag[i + j * nx] = v.imag
    })
  }
  const col = new ComplexArray(ny, Float32Array)
  for (let i = 0; i < nx; i++) {
    col.map((v, j) => {
      v.real = output.real[i + j * nx]
      v.imag = output.imag[i + j * nx]
    })
    col.FFT().forEach((v, j) => {
      output.real[i + j * nx] = v.real
      output.imag[i + j * nx] = v.imag
    })
  }
  return output
}

export function fft2Image(image: ImageData): ComplexArray {
  const rgba = splitRGBA(image.data)
  const nx = image.width
  const ny = image.height

  return mergeRGBA(
    fft2(new ComplexArray(rgba[0], Float32Array), nx, ny),
    fft2(new ComplexArray(rgba[1], Float32Array), nx, ny),
    fft2(new ComplexArray(rgba[2], Float32Array), nx, ny),
    rgba[3]
  )
}

function ifft2(input: ComplexArray, nx: number, ny: number): ComplexArray {
  const output = new ComplexArray(input.length, Float32Array)
  const col = new ComplexArray(ny, Float32Array)
  for (let i = nx - 1; i >= 0; i--) {
    col.map((v, j) => {
      v.real = input.real[i + j * nx]
      v.imag = input.imag[i + j * nx]
    })
    col.InvFFT().forEach((v, j) => {
      output.real[i + j * nx] = v.real
      output.imag[i + j * nx] = v.imag
    })
  }
  const row = new ComplexArray(nx, Float32Array)
  for (let j = ny - 1; j >= 0; j--) {
    row.map((v, i) => {
      v.real = output.real[i + j * nx]
      v.imag = output.imag[i + j * nx]
    })
    row.InvFFT().forEach((v, i) => {
      output.real[i + j * nx] = v.real
      output.imag[i + j * nx] = v.imag
    })
  }
  return output
}

export function ifft2Image(data: ComplexArray, width: number, height: number): ImageData {
  const n = data.length / 4
  const rc = new ComplexArray(n, Float32Array)
  const gc = new ComplexArray(n, Float32Array)
  const bc = new ComplexArray(n, Float32Array)
  for (let i = 0; i < n; ++i) {
    rc.real[i] = data.real[4 * i]
    rc.imag[i] = data.imag[4 * i]
    gc.real[i] = data.real[4 * i + 1]
    gc.imag[i] = data.imag[4 * i + 1]
    bc.real[i] = data.real[4 * i + 2]
    bc.imag[i] = data.imag[4 * i + 2]
  }
  const r = ifft2(rc, width, height)
  const g = ifft2(gc, width, height)
  const b = ifft2(bc, width, height)
  const result = new Uint8ClampedArray(data.length)
  for (let i = 0; i < n; ++i) {
    result[4 * i] = r.real[i]
    result[4 * i + 1] = g.real[i]
    result[4 * i + 2] = b.real[i]
    result[4 * i + 3] = data.real[4 * i + 3]
  }
  return new ImageData(result, width, height)
}
