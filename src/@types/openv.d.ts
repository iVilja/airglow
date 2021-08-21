declare global {
  interface Window {
    cv: any
  }

  namespace cv {
    export class Size {
      width: number
      height: number

      constructor(width?: number, height?: number)
    }

    export class Rect {
      x: number
      y: number
      width: number
      height: number

      constructor(x?: number, y?: number, width?: number, height?: number)
    }

    export class Mat {
      rows: number
      cols: number
      data: Uint8Array

      channels(): number

      convertTo(dst: Mat, type: number, alpha?: number, beta?: number): void

      copyTo(dst: Mat): void

      delete(): void

      roi(rect: Rect): Mat

      size(): Size

      type(): number

      ucharPtr(row: number, col?: number): Uint8Array

      static zeros(rows: number, cols: number, type: number): Mat
    }

    export class Scalar extends Array {
      constructor(v0?: number, v1?: number, v2?: number, v3?: number)

      static all(v: number): Scalar
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

    export function add(src1: Mat, src2: Mat, dst: Mat, mask?: Mat, dtype?: number): void

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

    export function cvtColor(src: Mat, dst: Mat, type: number): void

    export function imread(canvasID: string): Mat

    export function imshow(canvasID: string, data: Mat): void

    export function resize(src: Mat, dst: Mat, dsize: Size, fx?: number, fy?: number, interpolation?: number): void

    export function GaussianBlur(
      src: Mat, dst: Mat,
      ksize: Size,
      sigmaX: number, sigmaY?: number,
      borderType?: number
    ): void
  }
}

export {}
