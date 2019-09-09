/* tslint:disable:max-classes-per-file */

declare module 'jsfft' {
  export class ComplexNumber {
    public real: number
    public imag: number
  }

  export class ComplexArray {

    public real: Float32Array
    public imag: Float32Array

    public length: number

    constructor(x: Uint8ClampedArray | ComplexArray | number, arrayType: typeof Float32Array)

    public FFT(): ComplexArray

    public InvFFT(): ComplexArray

    public forEach(iterator: (value: ComplexNumber, i: number, n: number) => void): void

    public map(mapper: (value: ComplexNumber, i: number, n: number) => void): ComplexArray
  }

  export function FFTImageDataRGBA(data: Uint8ClampedArray, nx: number, ny: number): ComplexArray
}
