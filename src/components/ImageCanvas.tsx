import { ChangeEvent, useRef, useState } from "react"

import { getContext } from "../utils/utils"

import "./ImageCanvas.css"
import { i18n } from "../utils/i18n"

const clearCanvas = (canvas: HTMLCanvasElement) => {
  canvas.width = 10
  canvas.height = 10
  const ctx = getContext(canvas)
  ctx.clearRect(0, 0, 10, 10)
}

export const ImageCanvas = (props: {
  name: string,
  onImageChanged: (image: HTMLImageElement | null) => void
}) => {
  const [ image, setImage ] = useState<null | HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  const onImageChanged = async (e: ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    clearCanvas(canvas)
    const files = e.target.files
    if (files !== null && files.length > 0) {
      const file = files[0]
      const image = new Image()
      const reader = new FileReader()
      image.onload = () => {
        canvas.width = image.width
        canvas.height = image.height
        const ctx = getContext(canvas)
        ctx.drawImage(image, 0, 0)
        setImage(image)
        props.onImageChanged(image)
        return
      }
      reader.onloadend = () => {
        if (reader.result !== null) {
          image.src = reader.result.toString()
        }
      }
      reader.readAsDataURL(file)
      e.target.value = ""
    }
    setImage(image)
    props.onImageChanged(null)
  }
  const id = `file-${ props.name.split(/\s/).join("-") }`
  const ref = useRef<HTMLInputElement | null>(null)
  return <div className="airglow-image-canvas input-group">
    <div className="airglow-canvas-container mb-3">
      <canvas className="airglow-canvas" width={ 10 } height={ 10 } ref={ canvasRef } />
    </div>
    <div className="airglow-file input-group mb-3">
      <span className="input-group-text">{ i18n(props.name) }</span>
      <input id={ id }
             type="file" className="form-control"
             onChange={ onImageChanged }
             ref={ ref }
      />
      <div className="form-control" onClick={ () => {
        const fileInput = ref.current
        if (fileInput !== null) {
          fileInput.click()
        }
      } }>{
        image === null ? "" : `${ image.width }*${ image.height }`
      }</div>
      <label className="input-group-text" htmlFor={ id }>{ i18n("Browse") }</label>
    </div>
  </div>
}
