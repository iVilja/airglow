import { ChangeEvent, useEffect, useRef, useState } from "react"

import { getContext } from "../utils/utils"

import "./ImageCanvas.css"
import { i18n } from "../utils/i18n"


export const ImageCanvas = (props: {
  name: string,
  onImageChanged: (image: HTMLImageElement | null) => void,
  onCanvasSet: (canvas: HTMLCanvasElement | null) => void,
  disabled: boolean,
  disallowTransparency?: boolean
}) => {
  const [ image, setImage ] = useState<null | HTMLImageElement>(null)
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const clearCanvas = (canvas: HTMLCanvasElement | null) => {
    if (canvas === null) {
      return
    }
    canvas.width = 10
    canvas.height = 10
    const ctx = getContext(canvas)
    ctx.clearRect(0, 0, 10, 10)
    setImage(null)
    props.onImageChanged(null)
  }

  const { onCanvasSet } = props
  useEffect(() => onCanvasSet(canvasRef.current), [ onCanvasSet, canvasRef ])
  const onImageChanged = async (e: ChangeEvent<HTMLInputElement>) => {
    const canvas = canvasRef.current
    if (canvas === null) {
      return
    }
    clearCanvas(canvas)
    const files = e.target.files
    if (files === null || files.length < 1) {
      setImage(null)
      return
    }
    const file = files[0]
    const image = new Image()
    const reader = new FileReader()
    image.onload = () => {
      const { width, height } = image
      canvas.width = width
      canvas.height = height
      const ctx = getContext(canvas)
      if (props.disallowTransparency) {
        ctx.beginPath()
        ctx.fillStyle = "black"
        ctx.fillRect(0, 0, width, height)
      }
      ctx.drawImage(image, 0, 0)
      setImage(image)
      props.onImageChanged(image)
    }
    reader.onloadend = () => {
      if (reader.result !== null) {
        image.src = reader.result.toString()
      }
    }
    reader.readAsDataURL(file)
    e.target.value = ""
  }
  const id = props.name.split(/\s/).join("-")
  const fileID = `file-${ id }`
  const fileRef = useRef<HTMLInputElement | null>(null)
  return <div className="airglow-image-canvas input-group">
    <div className="airglow-canvas-container mb-3">
      <canvas className="airglow-canvas" width={ 10 } height={ 10 } ref={ canvasRef } id={ `canvas-${ id }` } />
    </div>
    <div className="airglow-file input-group mb-3">
      <label className="input-group-text" htmlFor={ fileID }>{ i18n(props.name) }</label>
      <input id={ fileID }
             type="file" className="form-control"
             onChange={ onImageChanged }
             ref={ fileRef }
             disabled={ props.disabled }
      />
      <div className="form-control" onClick={ () => {
        const fileInput = fileRef.current
        if (fileInput !== null) {
          fileInput.click()
        }
      } }>{
        image === null ? "" : `${ image.width }*${ image.height }`
      }</div>
      <button className="input-group-text" onClick={ (e) => {
        e.preventDefault()
        clearCanvas(canvasRef.current)
      } }>{ i18n("Clear") }</button>
    </div>
  </div>
}
