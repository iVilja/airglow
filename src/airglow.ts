import { ComplexArray } from 'jsfft'
import { fft2Image, ifft2Image } from './fft'

import { RNG } from './Random'
import { Logger } from './utils'

export function getMaxWatermarks(original: HTMLImageElement | null, secret: HTMLImageElement | null): number {
  if (original === null || secret === null) {
    return 0
  }
  const nRows = Math.floor(original.height / 2 / secret.height)
  const nCols = Math.floor(original.width / secret.width)
  return nRows * nCols
}

function shuffleWatermark(data: ImageData, rng: RNG): ImageData {
  const length = Math.floor(data.data.length / 4)
  const shuffleMap = rng.getPermutation(Math.floor(length / 2))
  const newData = new ImageData(data.data.slice(), data.width, data.height)
  shuffleMap.forEach((v, i) => {
    for (let k = 0; k < 4; ++k) {
      newData.data[i * 4 + k] = data.data[v * 4 + k]
      newData.data[(length - 1 - i) * 4 + k] = data.data[v * 4 + k]
    }
  })
  return newData
}

function putWatermarks(
  canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D,
  original: ImageData, secret: ImageData, nWatermarks: number
) {
  const nRows = Math.floor(original.height / 2 / secret.height)
  const nCols = Math.floor(original.width / secret.width)
  if (nRows === 0 || nCols === 0) {
    throw new Error(`Secret image is too large: use an image whose width <= ${ original.width } and` +
      `height <= ${ Math.floor(original.height / 2) }`)
  }
  const {width, height} = secret
  for (let i = 0; i < nRows; ++i) {
    for (let j = 0; j < nCols; ++j) {
      nWatermarks -= 1
      if (nWatermarks < 0) {
        return
      }
      ctx.putImageData(secret, j * width, i * height)
    }
  }
}

function makeWatermark(original: ImageData, secret: ImageData, rng: RNG, nWatermarks: number = 1): ImageData {
  const canvas = document.createElement('canvas')
  const {width, height} = original
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')!
  putWatermarks(canvas, ctx, original, secret, nWatermarks)
  const data = ctx.getImageData(0, 0, width, height)
  const shuffledData = shuffleWatermark(data, rng)
  return shuffledData
}

export async function encode(
  original: ImageData, secret: ImageData,
  secretKey: string, nWatermark: number, alpha: number,
  logger: Logger
): Promise<ImageData> {
  await logger(0, 'Initializing')
  secretKey = secretKey.trim()
  if (secretKey === '') {
    throw new Error('Secret key cannot be empty')
  }
  await logger(5, 'Making watermarks')
  const rng = new RNG(secretKey)
  const watermark = makeWatermark(original, secret, rng, nWatermark)
  await logger(20, 'Calculating the frequency domain of original image')
  const fftOriginal = fft2Image(original)
  await logger(40, 'Calculating the frequency domain of watermarks')
  const fftWatermark = fft2Image(watermark)
  await logger(60, 'Calculating the frequency domain of encoded image')
  const fftEncoded = new ComplexArray(fftOriginal.length, Float32Array)
  fftEncoded.map((value, i) => {
    value.real = fftOriginal.real[i] + fftWatermark.real[i] * alpha
    value.imag = fftOriginal.imag[i]
  })
  await logger(80, 'Calculating the resulting image')
  const encoded = ifft2Image(fftEncoded, original.width, original.height)
  await logger(100, 'Finished!', 'success')
  return encoded
}

export function decodeWatermark(watermark: ImageData, rng: RNG) {
  const length = Math.floor(watermark.data.length / 4)
  const shuffleMap = rng.getPermutation(Math.floor(length / 2))
  const data = new ImageData(watermark.data.slice(), watermark.width, watermark.height)
  shuffleMap.forEach((v, i) => {
    for (let k = 0; k < 4; ++k) {
      data.data[v * 4 + k] = watermark.data[i * 4 + k]
      data.data[(length - 1 - v) * 4 + k] = watermark.data[(length - 1 - i) * 4 + k]
    }
  })
  return data
}

export async function decode(
  original: ImageData, encoded: ImageData,
  secretKey: string, alpha: number,
  logger: Logger
):
  Promise<ImageData> {
  await logger(0, 'Initializing')
  secretKey = secretKey.trim()
  if (secretKey === ''
  ) {
    throw new Error('Secret key cannot be empty')
  }
  await logger(5, 'Calculating the frequency domain of original image')
  const fftOriginal = fft2Image(original)
  await logger(20, 'Calculating the frequency domain of encoded image')
  const fftEncoded = fft2Image(encoded)
  await logger(40, 'Calculating the frequency domain of watermarks')
  const fftWatermark = new ComplexArray(fftOriginal.length, Float32Array)
  fftWatermark.map((value, i) => {
    if (i % 4 === 3) {
      value.real = fftEncoded.real[i]
      return
    }
    value.real = (fftEncoded.real[i] - fftOriginal.real[i]) / alpha
    value.imag = (fftEncoded.imag[i] - fftOriginal.imag[i]) / alpha
  })
  await logger(60, 'Calculating the watermarks image')
  const watermark = ifft2Image(fftWatermark, original.width, original.height)
  await logger(80, 'Calculating the resulting image')
  const rng = new RNG(secretKey)
  const decoded = decodeWatermark(watermark, rng)
  await logger(100, 'Finished!', 'success')
  return decoded
}
