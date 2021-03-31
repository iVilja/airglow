import { fft2Image, free, ifft2Image, Tensor } from './fft'

import { RNG } from './Random'
import { getContext, Logger } from './utils'

export const getMaxWatermarks = (original: HTMLImageElement | null, secret: HTMLImageElement | null): number => {
  if (original === null || secret === null) {
    return 0
  }
  const nRows = Math.floor(original.height / 2 / secret.height)
  const nCols = Math.floor(original.width / secret.width)
  return nRows * nCols
}

const shuffleWatermark = (data: ImageData, rng: RNG): ImageData => {
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

const putWatermarks = (
  canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D,
  original: ImageData, secret: ImageData, nWatermarks: number
): void => {
  const nRows = Math.floor(original.height / 2 / secret.height)
  const nCols = Math.floor(original.width / secret.width)
  if (nRows === 0 || nCols === 0) {
    throw new Error(`Secret image is too large: use an image whose width <= ${ original.width } and` +
      ` height <= ${ Math.floor(original.height / 2) }`)
  }
  const { width, height } = secret
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

const makeWatermark = (original: ImageData, secret: ImageData, rng: RNG, nWatermarks = 1): ImageData => {
  const canvas = document.createElement('canvas')
  const { width, height } = original
  canvas.width = width
  canvas.height = height
  const ctx = getContext(canvas)
  putWatermarks(canvas, ctx, original, secret, nWatermarks)
  const data = ctx.getImageData(0, 0, width, height)
  const shuffledData = shuffleWatermark(data, rng)
  return shuffledData
}

interface MixArguments {
  alpha: number
}

const mix = (original: Tensor, secret: Tensor, args: MixArguments): Tensor => {
  return original.map((x, i) => {
      const t = new cv.Mat()
      cv.addWeighted(secret[i], args.alpha, x, 1, 0, t)
      return t
    }
  ) as Tensor
}

const separate = (original: Tensor, encoded: Tensor, args: MixArguments): Tensor => {
  return original.map((x, i) => {
    const t = new cv.Mat()
    cv.addWeighted(encoded[i], 1, x, -1, 0, t)
    cv.addWeighted(t, args.alpha, t, 0, 0, t)
    return t
  }) as Tensor
}

export const encode = async (
  original: ImageData, secret: ImageData,
  secretKey: string, nWatermark: number, alpha: number,
  logger: Logger
): Promise<ImageData> => {
  await logger(0, 'Initializing')
  secretKey = secretKey.trim()
  if (secretKey === '') {
    throw new Error('Secret key cannot be empty')
  }
  await logger(5, 'Making watermarks')
  const rng = new RNG(secretKey)
  const watermark = makeWatermark(original, secret, rng, nWatermark)
  await logger(20, 'Calculating the frequency domain of original image')
  const fftOriginal = await fft2Image(original)
  await logger(40, 'Calculating the frequency domain of watermarks')
  const fftWatermark = await fft2Image(watermark)
  await logger(60, 'Calculating the frequency domain of encoded image')
  const fftEncoded = mix(fftOriginal, fftWatermark, { alpha })
  await logger(80, 'Calculating the resulting image')
  const encoded = await ifft2Image(fftEncoded, original.width, original.height)
  await logger(100, 'Finished!', 'success')
  free(fftOriginal)
  free(fftWatermark)
  free(fftEncoded)
  return encoded
}

export const decodeWatermark = (watermark: ImageData, rng: RNG): ImageData => {
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

export const getScaled = (encoded: HTMLImageElement, original: ImageData): ImageData => {
  const canvas = document.createElement('canvas')
  const { width, height } = original
  canvas.width = width
  canvas.height = height
  const ctx = getContext(canvas)
  ctx.drawImage(encoded, 0, 0, width, height)
  const scaled = ctx.getImageData(0, 0, width, height)
  return scaled
}

export const decode = async (
  original: ImageData, encoded: HTMLImageElement,
  secretKey: string, alpha: number,
  logger: Logger
): Promise<ImageData> => {
  await logger(0, 'Initializing')
  secretKey = secretKey.trim()
  if (secretKey === ''
  ) {
    throw new Error('Secret key cannot be empty')
  }
  await logger(5, 'Calculating the frequency domain of original image')
  const fftOriginal = await fft2Image(original)
  await logger(20, 'Scaling the encoded image')
  const encodedScaled = getScaled(encoded, original)
  await logger(30, 'Calculating the frequency domain of encoded image')
  const fftEncoded = await fft2Image(encodedScaled)
  await logger(45, 'Calculating the frequency domain of watermarks')
  const fftWatermark = separate(fftOriginal, fftEncoded, { alpha })
  await logger(60, 'Calculating the watermarks image')
  const watermark = await ifft2Image(fftWatermark, original.width, original.height)
  await logger(80, 'Calculating the resulting image')
  const rng = new RNG(secretKey)
  const decoded = decodeWatermark(watermark, rng)
  await logger(100, 'Finished!', 'success')
  free(fftOriginal)
  free(fftWatermark)
  free(fftEncoded)
  return decoded
}
