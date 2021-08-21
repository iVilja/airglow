import "bootstrap/dist/css/bootstrap.min.css"

import { useEffect, useMemo, useState } from "react"

import { AlertType, Canvases, Images, ImageType, Logger, OnClickEventHandler } from "../utils/types"
import { ImageCanvas } from "./ImageCanvas"
import { i18n } from "../utils/i18n"

import "./Main.css"
import { decode, encode, getMaxWatermarks } from "../lib/airglow"

const download = (canvas: HTMLCanvasElement, filename: string) => {
  const a = document.createElement("a")
  a.href = canvas.toDataURL("image/png")
  a.download = filename
  a.style.display = "none"
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
}

const canvases: Canvases = {
  encoded: null, original: null, secret: null
}
const onCanvasSet = (key: ImageType) => (canvas: HTMLCanvasElement | null) => void (canvases[key] = canvas)

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
  const [ images, setImages ] = useState<Images>({
    encoded: null, original: null, secret: null
  })
  const onImageChange = (key: ImageType) => (image: HTMLImageElement | null) => void setImages({
    ...images,
    [key]: image
  })
  const [ numWatermarks, setNumWatermarks ] = useState(1)
  const [ secretKey, setSecretKey ] = useState("Airglow")
  const [ alpha, setAlpha ] = useState(5)
  const [ isWorking, toggleIsWorking ] = useState(false)

  const maxWatermarks = useMemo(() => getMaxWatermarks(images.original, images.secret), [
    images
  ])
  const canEncode = useMemo(() => images.secret !== null && images.original !== null &&
    numWatermarks <= maxWatermarks && secretKey.length > 0, [
    images, numWatermarks, maxWatermarks, secretKey
  ])
  const canDecode = useMemo(() => images.encoded !== null && images.original !== null &&
    secretKey.length > 0, [
    images, secretKey
  ])

  const onStart = (isEncode: boolean): OnClickEventHandler<HTMLButtonElement> => async (e) => {
    e.preventDefault()
    if (isWorking || Object.keys(canvases).some((k) => canvases[k as ImageType] === null)) {
      return
    }
    toggleIsWorking(true)
    const options = {
      numWatermarks, secretKey, alpha
    }
    try {
      const result = await (isEncode ? encode : decode)(canvases, logger, options)
      onImageChange(isEncode ? "encoded" : "secret")(result)
    } catch (e) {
      const err = e as Error
      await logger(null, err.message, "danger", err.stack)
    }
    toggleIsWorking(false)
  }

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
            name="Secret Image" disabled={ isWorking }
            onCanvasSet={ onCanvasSet("secret") }
            onImageChanged={ onImageChange("secret") }
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
              onChange={ (e) => {
                let n = parseInt(e.target.value)
                if (Number.isNaN(n)) {
                  return
                }
                n = n > maxWatermarks ? maxWatermarks : n < 1 ? 1 : n
                setNumWatermarks(n)
              } } />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <ImageCanvas
            name="Original Image" disabled={ isWorking }
            onCanvasSet={ onCanvasSet("original") }
            onImageChanged={ onImageChange("original") }
          />
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
          <ImageCanvas
            name="Encoded Image" disabled={ isWorking }
            onCanvasSet={ onCanvasSet("encoded") }
            onImageChanged={ onImageChange("encoded") }
          />
          <div className="airglow-buttons input-group mb-3">
            <button className="airglow-button btn btn-primary" onClick={ (e) => {
              e.preventDefault()
              const encoded = canvases.encoded
              if (encoded !== null) {
                download(encoded, "encoded.png")
              }
            } } disabled={ canvases.encoded === null }
            >{ i18n("Download") }</button>
          </div>
        </div>
      </div>
      <div className="row">
        <div className="col-12 col-lg-4">
          <div className="input-group mb-3">
            <label htmlFor="inputAlpha" className="form-label">
              { i18n("Alpha") }: { (alpha) }
            </label>
            <input type="range" className="form-range" min="1" max="100" id="inputAlpha" value={ alpha * 100 }
                   disabled={ isWorking }
                   onChange={ (e) => void setAlpha(parseInt(e.target.value) / 100) } />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="airglow-buttons input-group mt-3">
            <button
              className="airglow-button btn btn-primary" disabled={ isWorking || !canEncode }
              onClick={ onStart(true) }
            >Encode!
            </button>
            <button
              className="airglow-button btn btn-primary" disabled={ isWorking || !canDecode }
              onClick={ onStart(false) }
            >Decode!
            </button>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="airglow-buttons input-group mt-3">
            <a className="airglow-button btn btn-primary"
               href="https://github.com/ryukina/airglow"
               target="_blank"
               rel="noreferrer"
            >{ i18n("Docs") }
            </a>
          </div>
        </div>
      </div>
    </form>
  </div>
}