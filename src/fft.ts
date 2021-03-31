import * as tf from '@tensorflow/tfjs'

export const fft2Image = async (image: ImageData): Promise<tf.Tensor> => {
  // eslint-disable-next-line no-console
  console.log('fft2')
  const intArray = await tf.browser.fromPixelsAsync(image, 3)
  const input = intArray.as1D().toFloat().div(tf.scalar(255, 'float32'))
  const output = tf.rfft(input)
  return output
}

export const ifft2Image = async (input: tf.Tensor, width: number, height: number): Promise<ImageData> => {
  const inverse = tf.irfft(input)
  const output = inverse.clipByValue(0, 1).as3D(height, width, 3)
  const pixels = await tf.browser.toPixels(output)
  return new ImageData(pixels, width, height)
}
