export type Tensor = [ cv.Mat, cv.Mat, cv.Mat ]

export const free = (t: Tensor): void => Array.from({ length: 3 }).forEach((_, i) => t[i].delete())

const fftOneChannel = (
  src: cv.Mat
): cv.Mat => {
  const optimalRows = cv.getOptimalDFTSize(src.rows)
  const optimalCols = cv.getOptimalDFTSize(src.cols)
  const padded = new cv.Mat()
  const s0 = cv.Scalar.all(0)
  cv.copyMakeBorder(src, padded, 0, optimalRows - src.rows, 0,
    optimalCols - src.cols, cv.BORDER_CONSTANT, s0)

  const plane0 = new cv.Mat()
  padded.convertTo(plane0, cv.CV_32F)
  const planes = new cv.MatVector()
  const complexI = new cv.Mat()
  const plane1 = new cv.Mat.zeros(padded.rows, padded.cols, cv.CV_32F)
  planes.push_back(plane0)
  planes.push_back(plane1)
  cv.merge(planes, complexI)

  cv.dft(complexI, complexI)

  padded.delete()
  plane0.delete()
  plane1.delete()
  planes.delete()
  return complexI
}

const ifftOneChannel = (
  src: cv.Mat
): cv.Mat => {
  const p = new cv.Mat()
  cv.idft(src, p, cv.DFT_SCALE)
  const planes = new cv.MatVector()
  cv.split(p, planes)
  const result = planes.get(0)
  planes.delete()
  return result
}

export const fft2Image = async (
  image: ImageData
): Promise<Tensor> => {
  const src = cv.matFromImageData(image)
  const channels = new cv.MatVector()
  cv.split(src, channels)
  const output = Array.from({ length: 3 }).map((_, i) => fftOneChannel(channels.get(i)))
  return output as Tensor
}

export const ifft2Image = async (
  input: Tensor
): Promise<ImageData> => {
  const channels = new cv.MatVector()
  for (const ch of input) {
    const t = ifftOneChannel(ch)
    channels.push_back(t)
    t.delete()
  }
  const output = new cv.Mat()
  const result = new cv.Mat()
  cv.merge(channels, output)
  output.convertTo(result, cv.CV_8UC4)
  cv.cvtColor(result, result, cv.COLOR_RGB2RGBA)
  const imageData = new ImageData(new Uint8ClampedArray(result.data), result.cols, result.rows)
  channels.delete()
  output.delete()
  result.delete()
  return imageData
}
