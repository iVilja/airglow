import React from "react"

export interface ImageDict<T> {
  "secret": T
  "original": T
  "encoded": T
}

export type ImageType = keyof ImageDict<any>

export type Canvases = ImageDict<HTMLCanvasElement | null>
export type Images = ImageDict<HTMLImageElement | null>

export type AlertType = "primary" | "danger" | "success"

export type OnClickEventHandler<T> = (event: React.MouseEvent<T>) => void

export type Logger = (
  progress: number | null, status: string,
  alertType?: AlertType, errorStack?: string
) => Promise<void>

