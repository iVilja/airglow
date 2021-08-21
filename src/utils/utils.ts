import { ImageDict } from "./types"

export const swap = (arr: number[] | Uint8ClampedArray, i: number, j: number): void => {
  const t = arr[i]
  arr[i] = arr[j]
  arr[j] = t
}

export const getCurrentVersion = (): string => {
  const versionNumber = process.env.REACT_APP_VERSION || "0.0.0"
  const tmp = window.location.pathname.split("/")
  if (tmp.length > 1) {
    const s = tmp[1]
    if (s === "dev") {
      return s
    } else if (s.startsWith("v")) {
      const v = s.slice(1)
      if (!versionNumber.startsWith(v)) {
        return "???"
      }
    }
  }
  return versionNumber
}

export const compareVersion = (a: string, b: string): number => {
  if (a === "dev") {
    return -1
  } else if (b === "dev") {
    return 1
  }
  const regex = /^(\d+)\.(\d+)\.(\d+)$/
  const aa = regex.exec(a) || [ "0", "0", "0", "0" ]
  const bb = regex.exec(b) || [ "0", "0", "0", "0" ]
  for (const i of [ 1, 2, 3 ]) {
    const x = parseInt(aa[i], 10)
    const y = parseInt(bb[i], 10)
    if (x > y) {
      return -1
    } else if (x < y) {
      return 1
    }
  }
  return 0
}

export const getContext = (canvas: HTMLCanvasElement): CanvasRenderingContext2D => {
  const ctx = canvas.getContext("2d")
  if (!ctx) {
    throw new Error("No 2D context.")
  }
  return ctx
}
export const getImageData = (
  canvas: HTMLCanvasElement
): ImageData => getContext(canvas).getImageData(0, 0, canvas.width, canvas.height)

export const isDevelopment = process.env.NODE_ENV === "development"

export function checkNulls<T>(
  ss: ImageDict<T | null>
): asserts ss is ImageDict<T> {
  if (ss.secret === null || ss.original === null || ss.encoded === null) {
    throw new Error("Check null failed")
  }
}

// For test use only
export const showImage = (data: cv.Mat) => {
  const {width, height} = data.size()
  const canvas = document.createElement("canvas")
  canvas.id = "tmp"
  canvas.width = width
  canvas.height = height
  document.body.appendChild(canvas)
  cv.imshow("tmp", data)
  const image = new Image(width, height)
  image.src = canvas.toDataURL("image/png")
  document.body.removeChild(canvas)
  const w = window.open("about:blank", "__blank")
  w?.document.body.appendChild(image)
}
