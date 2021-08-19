import "bootstrap/dist/css/bootstrap.min.css"

import { useState } from "react"

import { AlertType, Logger } from "../utils/utils"
import { ImageCanvas } from "./ImageCanvas"
import { i18n } from "../utils/i18n"

import "./Main.css"

export const Main = (): JSX.Element => {
  const [ status, setStatus ] = useState({
    type: null, message: ""
  } as {
    type: AlertType | null,
    message: string
  })
  const [ progress, setProgress ] = useState(0)
  const logger: Logger = async (progress, status, alertType) => {
    setProgress(progress)
    setStatus({
      type: alertType === undefined ? null : alertType,
      message: status
    })
  }
  const [ secretImage, setSecretImage ] = useState<HTMLImageElement | null>(null)
  const [ originalImage, setOriginalImage ] = useState<HTMLImageElement | null>(null)
  const [ encodedImage, setEncodedImage ] = useState<HTMLImageElement | null>(null)
  const [ watermark, setWatermark ] = useState({
    min: 1,
    max: 1,
    value: 1
  })
  const [ secretKey, setSecretKey ] = useState("Airglow")
  const [ alpha, setAlpha ] = useState(5)

  return <div className="airglow-main container-fluid">
    <div className={ "alert alert-dismissible fade show" + (status.type !== null ? ` alert-${ status.type }` : "") }
         role="alert" style={ { display: status.type === null ? "none" : "block" } }>
      { status.message }
      <button type="button" className="close" data-dismiss="alert" aria-label="Close"
              onClick={ () => {
                setStatus({ type: null, message: "" })
              } }>
        <span aria-hidden="true">&times;</span>
      </button>
    </div>
    <div className="airglow-progress progress mb-3">
      <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
           style={ { width: `${ progress }%` } } />
    </div>
    <form className="airglow-form">
      <div className="row">
        <div className="col-12 col-lg-4">
          <ImageCanvas name="Secret Image" onImageChanged={ setSecretImage } />
          <div className="input-group mb-3">
            <span className="input-group-text">{ i18n("Number of Watermarks") }</span>
            <input
              type="number" className="form-control"
              required={ true }
              min={ watermark.min }
              max={ watermark.max }
              value={ watermark.value }
              onChange={ (e) => {
                setWatermark({
                  ...watermark,
                  value: parseInt(e.target.value)
                })
              } } />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <ImageCanvas name="Original Image" onImageChanged={ setOriginalImage } />
          <div className="input-group mb-3">
            <span className="input-group-text">{ i18n("Secret Key") }</span>
            <input
              type="text" className="form-control"
              required={ true }
              value={ secretKey }
              onChange={ (e) => void setSecretKey(e.target.value) }
            />
            <div className="airglow-help-text form-text">{ i18n("A secret key used to encrypt the data.") }</div>
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <ImageCanvas name="Encoded Image" onImageChanged={ setEncodedImage } />
          <div className="airglow-buttons input-group mb-3">
            <button className="airglow-button btn btn-primary">{ i18n("Download") }</button>
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
                   onChange={ (e) => void setAlpha(parseInt(e.target.value)) } />
          </div>
        </div>
        <div className="col-12 col-lg-4">
          <div className="airglow-buttons input-group mt-3">
            <button className="airglow-button btn btn-primary" disabled={ true }>Encode!</button>
            <button className="airglow-button btn btn-primary" disabled={ true }>Decode!</button>
          </div>
        </div>
      </div>
    </form>
  </div>
}