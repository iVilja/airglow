import { fft2Image, free, ifft2Image, Tensor } from "./fft"

import { RNG } from "../utils/Random"
import { Canvases, Logger } from "../utils/types"
import { checkNulls, showImage } from "../utils/utils"

interface AirglowOptions {
  alpha: number
  numWatermarks: number
  secretKey: string
}

export const getMaxWatermarks = (original: HTMLImageElement | null, secret: HTMLImageElement | null): number => {
  if (original === null || secret === null) {
    return 0
  }
  const nRows = Math.floor(original.height / 2 / secret.height)
  const nCols = Math.floor(original.width / secret.width)
  return nRows * nCols
}

const shuffleWatermark = (data: cv.Mat, rng: RNG): cv.Mat => {
  const length = Math.floor(data.data.length / 4)
  const shuffleMap = rng.getPermutation(Math.floor(length / 2))
  const newData = cv.Mat.zeros(data.rows, data.cols, data.type())
  shuffleMap.forEach((v, i) => {
    for (let k = 0; k < 4; ++k) {
      newData.data[i * 4 + k] = data.data[v * 4 + k]
      newData.data[(length - 1 - i) * 4 + k] = data.data[v * 4 + k]
    }
  })
  return newData
}

const putWatermarks = (
  data: cv.Mat,
  original: cv.Mat,
  secret: cv.Mat,
  nWatermarks: number
): void => {
  const nRows = Math.floor(original.rows / 2 / secret.cols)
  const nCols = Math.floor(original.cols / secret.cols)
  const nChannels = data.channels()
  if (nRows === 0 || nCols === 0) {
    throw new Error(`Secret image is too large: use an image whose width <= ${ original.cols } and` +
      ` height <= ${ Math.floor(original.rows / 2) }`)
  }
  const { width, height } = secret.size()
  for (let i = 0; i < nRows; ++i) {
    for (let j = 0; j < nCols; ++j) {
      nWatermarks -= 1
      if (nWatermarks < 0) {
        return
      }
      for (let x = 0; x < height; ++x) {
        for (let y = 0; y < width; ++y) {
          const a = data.ucharPtr(i * height + x, j * width + y)
          const b = secret.ucharPtr(x, y)
          for (let c = 0; c < nChannels; ++c) {
            a[c] = b[c]
          }
        }
      }
    }
  }
}

const makeWatermark = (
  original: cv.Mat,
  secret: cv.Mat,
  rng: RNG,
  nWatermarks = 1
): cv.Mat => {
  const { width, height } = original.size()
  const data = cv.Mat.zeros(height, width, secret.type())
  const processed = new cv.Mat()
  const ksize = new cv.Size(3, 3)
  cv.GaussianBlur(secret, processed, ksize, 0, 0)
  putWatermarks(data, original, processed, nWatermarks)
  const shuffled = shuffleWatermark(data, rng)
  processed.delete()
  data.delete()
  return shuffled
}

const mix = (original: Tensor, secret: Tensor, args: AirglowOptions): Tensor => {
  return original.map((x, i) => {
      const t = new cv.Mat()
      cv.addWeighted(secret[i], args.alpha, x, 1, 0, t)
      return t
    }
  ) as Tensor
}

const separate = (original: Tensor, encoded: Tensor, args: AirglowOptions): Tensor => {
  return original.map((x, i) => {
    const t = new cv.Mat()
    cv.addWeighted(encoded[i], 1, x, -1, 0, t)
    cv.addWeighted(t, 1 / args.alpha, t, 0, 0, t)
    return t
  }) as Tensor
}

export const encode = async (
  canvases: Canvases,
  logger: Logger,
  options: AirglowOptions
): Promise<HTMLImageElement> => {
  await logger(0, "Initializing")
  const secretKey = options.secretKey.trim()
  if (secretKey === "") {
    throw new Error("Secret key cannot be empty")
  }
  checkNulls(canvases)
  const original = cv.imread(canvases.original.id)
  const secret = cv.imread(canvases.secret.id)
  await logger(5, "Making watermarks")
  const rng = new RNG(secretKey)
  const watermark = makeWatermark(original, secret, rng, options.numWatermarks)
  await logger(20, "Calculating the frequency domain of original image")
  const fftOriginal = await fft2Image(original)
  await logger(40, "Calculating the frequency domain of watermarks")
  const fftWatermark = await fft2Image(watermark)
  await logger(60, "Calculating the frequency domain of encoded image")
  const fftEncoded = mix(fftOriginal, fftWatermark, options)
  await logger(80, "Calculating the resulting image")
  const encoded = await ifft2Image(fftEncoded)
  const result = showImage(canvases.encoded, encoded)
  await logger(100, "Finished!", "success")
  watermark.delete()
  free(fftOriginal)
  free(fftWatermark)
  free(fftEncoded)
  return result
}

export const decodeWatermark = (watermark: cv.Mat, rng: RNG): cv.Mat => {
  const length = Math.floor(watermark.data.length / 4)
  const shuffleMap = rng.getPermutation(Math.floor(length / 2))
  const data = cv.Mat.zeros(watermark.rows, watermark.cols, watermark.type())
  shuffleMap.forEach((v, i) => {
    for (let k = 0; k < 4; ++k) {
      data.data[v * 4 + k] = watermark.data[i * 4 + k]
      data.data[(length - 1 - v) * 4 + k] = watermark.data[(length - 1 - i) * 4 + k]
    }
  })
  return data
}

export const getScaled = (encoded: cv.Mat, original: cv.Mat): cv.Mat => {
  const scaled = new cv.Mat()
  cv.resize(encoded, scaled, original.size())
  return scaled
}

export const decode = async (
  canvases: Canvases,
  logger: Logger,
  options: AirglowOptions
): Promise<HTMLImageElement> => {
  await logger(0, "Initializing")
  const secretKey = options.secretKey.trim()
  if (secretKey === ""
  ) {
    throw new Error("Secret key cannot be empty")
  }
  checkNulls(canvases)
  const original = cv.imread(canvases.original.id)
  const encoded = cv.imread(canvases.encoded.id)
  await logger(5, "Calculating the frequency domain of original image")
  const fftOriginal = await fft2Image(original)
  await logger(20, "Scaling the encoded image")
  const encodedScaled = getScaled(encoded, original)
  await logger(30, "Calculating the frequency domain of encoded image")
  const fftEncoded = await fft2Image(encodedScaled)
  await logger(45, "Calculating the frequency domain of watermarks")
  const fftWatermark = separate(fftOriginal, fftEncoded, options)
  await logger(60, "Calculating the watermarks image")
  const watermark = await ifft2Image(fftWatermark)
  await logger(80, "Calculating the resulting image")
  const rng = new RNG(secretKey)
  const decoded = decodeWatermark(watermark, rng)
  const result = showImage(canvases.secret, decoded)
  await logger(100, "Finished!", "success")
  free(fftOriginal)
  free(fftWatermark)
  free(fftEncoded)
  encodedScaled.delete()
  watermark.delete()
  return result
}
