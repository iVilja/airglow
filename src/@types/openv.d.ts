declare global {
  interface Window {
    cv: any
  }

  namespace cv {
    export class Mat {
      rows: number
      cols: number
      data: Uint8Array

      convertTo(dst: Mat, type: number, scale?: number): Mat

      delete(): void
    }

    namespace Mat {
      export class zeros extends Mat {
        constructor(rows: number, cols: number, type: number)
      }
    }

    export class Scalar extends Mat {
      constructor(x: number)

      static all(a: number): Scalar
    }

    export class MatVector {
      get(i: number): Mat

      push_back(a: Mat): void

      delete(): void

      size(): number
    }


    export const CV_32F: number
    export const CV_8UC4: number
    export const DFT_SCALE: number
    export const DFT_INVERSE: number
    export const BORDER_CONSTANT: number
    export const COLOR_RGB2RGBA: number

    export function addWeighted(src1: Mat, alpha: number, src2: Mat, beta: number, gamma: number, dst: Mat): Mat

    export function subtract(src1: Mat, src2: Mat, dst?: Mat): Mat

    export function multiply(src1: Mat, src2: Mat, dst?: Mat): Mat

    export function divide(src1: Mat, src2: Mat, dst?: Mat): Mat

    export function matFromImageData(imageData: ImageData): Mat

    export function getOptimalDFTSize(n: number): number

    export function copyMakeBorder(
      src: Mat, dst: Mat,
      top: number, bottom: number, left: number, right: number,
      borderType: number, value: Scalar
    ): void

    export function split(src: Mat, mv: MatVector): void

    export function merge(mv: MatVector, dst: Mat): void

    export function dft(src: Mat, dst?: Mat, flags?: number): Mat

    export function idft(src: Mat, dst?: Mat, flags?: number): Mat

    export function cvtColor(src: Mat, dst: Mat, type: number): void
  }
}

export {}
