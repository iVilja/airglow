/* tslint:disable:no-bitwise */

import { swap } from './utils'

const UINT32_MAX = 4294967295

export interface IRandomState {
  a: number
  b: number
  c: number
  d: number
}

export type RandomSeed = IRandomState | number | string

export class RNG {

  public static hashCode(s: string): number {
    let hash = 0
    if (s.length === 0) {
      return hash
    }
    for (let i = 0; i < s.length; i++) {
      const chr = s.charCodeAt(i)
      hash = ((hash << 5) - hash) + chr
      hash %= UINT32_MAX
    }
    return hash
  }

  public static makeSeed(state?: number | string): number {
    if (typeof state === 'number') {
      return state % UINT32_MAX
    } else if (typeof state === 'string') {
      return RNG.hashCode(state) % UINT32_MAX
    }
    return Date.now() % UINT32_MAX
  }

  public static splitMix32(x: [number]): number {
    x[0] = (x[0] + 0x9e3779b9) % UINT32_MAX
    let z = x[0]
    z = ((z ^ (z >>> 16)) * 0x85ebca6b) % UINT32_MAX
    z = ((z ^ (z >>> 13)) * 0xc2b2ae35) % UINT32_MAX
    return (z ^ (z >>> 16)) % UINT32_MAX
  }

  private s: IRandomState

  constructor(seed?: RandomSeed) {
    this.setState(seed)
  }

  public setState(state?: RandomSeed) {
    if (state === undefined || typeof state !== 'object') {
      const seed: [number] = [RNG.makeSeed(state)]
      const a = RNG.splitMix32(seed)
      const b = RNG.splitMix32(seed)
      const c = RNG.splitMix32(seed)
      const d = RNG.splitMix32(seed)
      state = {a, b, c, d}
    }
    this.s = state
  }

  public getState(): IRandomState {
    return this.s
  }

  public getPermutation(length: number): number[] {
    const arr = Array.from({ length }, (_, i) => i)
    while (length > 1) {
      length -= 1
      const j = Math.floor(this.random() * length)
      swap(arr, length, j)
    }
    return arr
  }

  public random(): number {
    const s = this.s
    const t = s.b << 9
    let r = s.a * 5
    r = (r << 7 | r >>> 25) * 9
    s.c ^= s.a
    s.d ^= s.b
    s.b ^= s.c
    s.a ^= s.d
    s.c ^= t
    s.d = s.d << 11 | s.d >>> 21
    return (r >>> 0) / 4294967296
  }
}
