import "bootstrap/dist/css/bootstrap.min.css"

import { useEffect, useMemo, useState } from "react"

import { AlertType, getContext, getImageData, Logger } from "../utils/utils"
import { clearCanvas, ImageCanvas } from "./ImageCanvas"
import { i18n } from "../utils/i18n"

import "./Main.css"
import { encode } from "../lib/airglow"

const download = (canvas: HTMLCanvasElement, filename: string) => {
  const a = document.createElement("a")
  a.href = canvas.toDataURL("image/png")
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const startEncode = async (
  originalCanvas: HTMLCanvasElement | null,
  secretCanvas: HTMLCanvasElement | null,
  encodedCanvas: HTMLCanvasElement | null,
  logger: Logger,
  options: {
    numWatermarks: number; secretKey: string; alpha: number
  },
) => {
  if (originalCanvas === null || secretCanvas === null || encodedCanvas === null) {
    return
  }
  await logger(0, "123")
  clearCanvas(encodedCanvas)
  try {
    const original = getImageData(originalCanvas)
    const secret = getImageData(secretCanvas)
    const result = await encode(original, secret, logger, options)
    encodedCanvas.width = result.width
    encodedCanvas.height = result.height
    getContext(encodedCanvas).putImageData(result, 0, 0)
  } catch (e) {
    const err = e as Error
    await logger(null, err.message, "danger", err.stack)
  }
}

let loggingResolve: ((v: void) => void) | null = null

export const Main = (): JSX.Element => {
  const [ status, setStatus ] = useState({
    type: null, message: ""
  } as {
    type: AlertType | null,
    message: string
  })
  const [ progress, setProgress ] = useState(0)
  useEffect(() => {
    if (loggingResolve !== null) {
      const t = loggingResolve
      loggingResolve = null
      setTimeout(t, 300)
    }
  })
  const logger: Logger = (
    progress, status, alertType, stack
  ) => new Promise<void>(resolve => {
    if (alertType === "danger") {
      console.error(stack === undefined ? status : stack)
    } else {
      console.log(`${ progress }: ${ status }`)
    }
    loggingResolve = resolve
    if (progress !== null) {
      setProgress(progress)
    }
    setStatus({
      type: alertType === undefined ? null : alertType,
      message: status
    })
  })
  const [ secretCanvas, setSecretCanvas ] = useState<HTMLCanvasElement | null>(null)
  const [ originalCanvas, setOriginalCanvas ] = useState<HTMLCanvasElement | null>(null)
  const [ encodedCanvas, setEncodedCanvas ] = useState<HTMLCanvasElement | null>(null)
  const [ numWatermarks, setNumWatermarks ] = useState(1)
  const [ maxWatermarks, setMaxWatermarks ] = useState(1)
  const [ secretKey, setSecretKey ] = useState("Airglow")
  const [ alpha, setAlpha ] = useState(5)
  const [ isWorking, toggleIsWorking ] = useState(false)

  const canEncode = useMemo(() => secretCanvas !== null && originalCanvas !== null &&
    numWatermarks <= maxWatermarks && secretKey.length > 0, [
    secretCanvas, originalCanvas, numWatermarks, maxWatermarks, secretKey
  ])
  const canDecode = useMemo(() => encodedCanvas !== null && originalCanvas !== null &&
    numWatermarks <= maxWatermarks && secretKey.length > 0, [
    encodedCanvas, originalCanvas, numWatermarks, maxWatermarks, secretKey
  ])

  return <div className="airglow-main container-fluid">
    <div className={ "alert alert-dismissible fade show" + (status.type !== null ? ` alert-${ status.type }` : "") }
         role="alert" style={ { display: status.type === null ? "none" : "block" } }>
      { status.message }
      <button type="button" className="btn-close" data-bs-dismiss="alert" aria-label="Close"
              onClick={ () => {
                setStatus({ type: null, message: "" })
              } }>
      </button>
    </div>
    <div className="airglow-progress progress mb-3">
      <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
           style={ { width: `${ progress }%` } } />
    </div>
    <form className="airglow-form">
      <div className="row">
        <div className="col-12 col-lg-4">
          <ImageCanvas
            name="Secret Image" onImageChanged={ setSecretCanvas } disabled={ isWorking }
          />
          <div className="input-group mb-3">
            <span className="input-group-text">{ i18n("Number of Watermarks") }</span>
            <input
              type="number" className="form-control"
              required={ true }
              min={ 1 }
              max={ maxWatermarks }
              value={ numWatermarks }
              disabled={ isWorking }
              onChange={ (e) => void setNumWatermarks(parseInt(e.target.value)) } />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <ImageCanvas name="Original Image" onImageChanged={ setOriginalCanvas } disabled={ isWorking } />
          <div className="input-group mb-3">
            <span className="input-group-text">{ i18n("Secret Key") }</span>
            <input
              type="text" className="form-control"
              required={ true }
              value={ secretKey }
              disabled={ isWorking }
              onChange={ (e) => void setSecretKey(e.target.value) }
            />
            <div className="airglow-help-text form-text">{ i18n("A secret key used to encrypt the data.") }</div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <ImageCanvas name="Encoded Image" onImageChanged={ setEncodedCanvas } disabled={ isWorking } />
          <div className="airglow-buttons input-group mb-3">
            <button className="airglow-button btn btn-primary" onClick={ (e) => {
              e.preventDefault()
              if (encodedCanvas !== null) {
                download(encodedCanvas, "encoded.png")
              }
            } } disabled={ encodedCanvas === null }
            >{ i18n("Download") }</button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12 col-lg-4">
          <div className="input-group mb-3">
            <label htmlFor="inputAlpha" className="form-label">
              { i18n("Alpha") }: { (alpha / 100) }
            </label>
            <input type="range" className="form-range" min="1" max="100" id="inputAlpha" value={ alpha }
                   disabled={ isWorking }
                   onChange={ (e) => void setAlpha(parseInt(e.target.value)) } />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="airglow-buttons input-group mt-3">
            <button
              className="airglow-button btn btn-primary" disabled={ isWorking || !canEncode }
              onClick={ async (e) => {
                e.preventDefault()
                if (isWorking) {
                  return
                }
                toggleIsWorking(true)
                await startEncode(
                  originalCanvas, secretCanvas, encodedCanvas,
                  logger, { secretKey, numWatermarks, alpha }
                )
                toggleIsWorking(false)
              } }
            >Encode!
            </button>
            <button
              className="airglow-button btn btn-primary" disabled={ isWorking || !canDecode }
              onClick={ (e) => {
                e.preventDefault()
                if (isWorking) {
                  return
                }
                toggleIsWorking(true)
                toggleIsWorking(false)
              } }
            >Decode!
            </button>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="airglow-buttons input-group mt-3">
            <a className="airglow-button btn btn-primary"
               href="https://github.com/ryukina/airglow" target="_blank">
              { i18n("Docs") }
            </a>
          </div>
        </div>
      </div>
    </form>
  </div>
}