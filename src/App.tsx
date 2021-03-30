import 'bootstrap/dist/css/bootstrap.min.css'

import * as React from 'react'

import './App.css'

import { decode, encode, getMaxWatermarks } from './airglow'
import { getCurrentVersion, AlertType, getContext } from './utils'

import Footer from './Footer'

interface IAppFormData {
  secretKey: string
  alpha: string
  nWatermarks: string
}

interface IAppState {
  alertType: AlertType | null
  formData: IAppFormData
  images: {
    encoded: HTMLImageElement | null
    original: HTMLImageElement | null
    secret: HTMLImageElement | null
  }
  progress: number
  status: string
}

type ImageType = 'original' | 'secret' | 'encoded'

class App extends React.Component<Record<string, never>, IAppState> {

  private static clearCanvas(canvas: HTMLCanvasElement): void {
    canvas.width = 10
    canvas.height = 10
    const ctx = getContext(canvas)
    ctx.clearRect(0, 0, 10, 10)
  }

  public canvases = {
    encoded: React.createRef<HTMLCanvasElement>(),
    original: React.createRef<HTMLCanvasElement>(),
    secret: React.createRef<HTMLCanvasElement>()
  }

  public onDismissAlert = this.dismissAlert.bind(this)
  public onLogger = this.logger.bind(this)
  public onEncode = this.encode.bind(this)
  public onDecode = this.decode.bind(this)

  private logging: (() => void) | null = null
  private isWorking = false

  public constructor(props: Record<string, never>) {
    super(props)
    this.state = {
      alertType: null,
      formData: {
        alpha: '1',
        nWatermarks: '1',
        secretKey: ''
      },
      images: {
        encoded: null,
        original: null,
        secret: null
      },
      progress: 0,
      status: ''
    }
    window.app = this
  }

  public dismissAlert(): void {
    this.setState({ alertType: null, status: '' })
  }

  public updateImage(type: ImageType, image: HTMLImageElement | null): void {
    const images = this.state.images
    images[type] = image
    this.setState({
      images
    })
  }

  public onChangeFile(type: ImageType): (e: React.ChangeEvent<HTMLInputElement>) => void {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const canvas = this.canvases[type].current
      if (canvas === null) {
        return
      }
      App.clearCanvas(canvas)
      const fileInput = e.target as HTMLInputElement
      const files = fileInput.files
      if (files === null || files.length < 1) {
        this.updateImage(type, null)
        return
      }
      const file = files[0]
      const image = new Image()
      const reader = new FileReader()
      image.onload = () => {
        canvas.width = image.width
        canvas.height = image.height
        const ctx = getContext(canvas)
        ctx.drawImage(image, 0, 0)
        this.updateImage(type, image)
      }
      reader.onloadend = () => {
        if (reader.result !== null) {
          image.src = reader.result.toString()
        }
      }
      reader.readAsDataURL(file)
      fileInput.value = ''
    }
  }

  public logger(progress: number, status: string, alertType: AlertType = 'primary'): Promise<void> {
    return new Promise<void>(resolve => {
      this.logging = () => {
        resolve()
      }
      this.setState({
        alertType,
        progress,
        status
      })
    })
  }

  public componentDidUpdate(): void {
    if (this.logging !== null) {
      const t = this.logging
      this.logging = null
      setTimeout(t, 300)
    }
  }

  public onDownload(type: ImageType): (e: React.MouseEvent<HTMLButtonElement>) => void {
    return (e: React.MouseEvent<HTMLButtonElement>) => {
      e.preventDefault()
      const canvas = this.canvases[type].current
      if (canvas === null) {
        return
      }
      const dataURL = canvas.toDataURL('image/png')
      const title = `${ type }.png`
      const w = window.open('about:blank', title)
      if (!w) {
        throw Error('Cannot download.')
      }
      w.document.title = title
      const img = w.document.createElement('img')
      img.src = dataURL
      w.document.body.appendChild(img)
    }
  }

  public async encode(event: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    event.preventDefault()
    if (this.isWorking) {
      return
    }
    this.isWorking = true
    const { secretKey, alpha, nWatermarks } = this.state.formData
    // eslint-disable-next-line @typescript-eslint/no-explicit-any,@typescript-eslint/no-unsafe-assignment
    const data: { [type in ImageType]: ImageData } = {} as any
    for (const typeName of ['original', 'secret']) {
      const type = typeName as ImageType
      const ctx = getContext(this.canvases[type].current)
      const img = this.state.images[type]
      if (img === null) {
        return
      }
      data[type] = ctx.getImageData(0, 0, img.width, img.height)
    }
    const canvas = this.canvases.encoded.current
    if (!canvas) {
      throw new Error('Not initialized.')
    }
    App.clearCanvas(canvas)
    try {
      const result = await encode(
          data.original, data.secret,
          secretKey,
          parseInt(nWatermarks, 10), parseFloat(alpha) / 100,
          this.onLogger
      )
      canvas.width = result.width
      canvas.height = result.height
      const ctx = getContext(canvas)
      ctx.putImageData(result, 0, 0)
      const image = document.createElement('img')
      image.onload = () => this.updateImage('encoded', image)
      image.src = canvas.toDataURL('image/png')
    } catch (e) {
      this.setState({
        alertType: 'danger',
        status: (e as Error).message
      })
    }
    this.isWorking = false
  }

  public async decode(event: React.MouseEvent<HTMLButtonElement>): Promise<void> {
    event.preventDefault()
    if (this.isWorking) {
      return
    }
    this.isWorking = true
    const { alpha, secretKey } = this.state.formData
    const ctxOriginal = getContext(this.canvases.original.current)
    const originalImage = this.state.images.original
    if (originalImage === null) {
      return
    }
    const original = ctxOriginal.getImageData(0, 0, originalImage.width, originalImage.height)
    const encoded = this.state.images.encoded
    if (encoded === null) {
      return
    }
    const canvas = this.canvases.secret.current
    if (!canvas) {
      throw new Error('No canvas.')
    }
    App.clearCanvas(canvas)
    try {
      const result = await decode(
          original, encoded, secretKey,
          parseFloat(alpha) / 100, this.onLogger
      )
      canvas.width = result.width
      canvas.height = result.height
      const ctx = getContext(canvas)
      ctx.putImageData(result, 0, 0)
      const image = document.createElement('img')
      image.onload = () => this.updateImage('secret', image)
      image.src = canvas.toDataURL('image/png')
    } catch (e) {
      this.setState({
        alertType: 'danger',
        status: (e as Error).message
      })
    }
    this.isWorking = false
  }

  public render(): JSX.Element {
    const { alertType, formData, images, progress, status } = this.state
    const encodeDisabled = images.original === null || images.secret === null || formData.secretKey.trim() === ''
    const decodeDisabled = images.encoded === null || images.original === null || formData.secretKey.trim() === ''
    const maxWatermarks = getMaxWatermarks(images.original, images.secret)
    return (<div className="App">
      <form className="airglow-form container-fluid">
        <h1>Airglow ({ getCurrentVersion() })</h1>
        <div className={ 'alert alert-dismissible fade show' + (alertType !== null ? ` alert-${ alertType }` : '') }
             role="alert" style={ { display: alertType === null ? 'none' : 'block' } }>
          { status }
          <button type="button" className="close" data-dismiss="alert" aria-label="Close"
                  onClick={ this.onDismissAlert }>
            <span aria-hidden="true">&times;</span>
          </button>
        </div>
        <div className="airglow-progress progress">
          <div className="progress-bar progress-bar-striped progress-bar-animated" role="progressbar"
               style={ { width: `${ progress }%` } }/>
        </div>
        <div className="row">
          <div className="col-12 col-lg-4 container">
            <div className="form-group">
              <div className="airglow-canvas-container">
                <canvas className="airglow-canvas" width={ 10 } height={ 10 } ref={ this.canvases.secret }/>
              </div>
              <div className="airglow-file input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">Secret Image</span>
                </div>
                <div className="custom-file">
                  <input type="file" className="custom-file-input"
                         onChange={ this.onChangeFile('secret') }/>
                  <label className="custom-file-label" htmlFor="inputGroupSecretImage">{
                    images.secret === null ? '' : `${ images.secret.width }*${ images.secret.height }`
                  }</label>
                </div>
              </div>
            </div>
            <div className="form-group input-group">
              <div className="input-group-prepend">
                <label className="input-group-text" htmlFor="forNWatermarks">Number of Watermarks</label>
              </div>
              <input type="number" className="form-control" id="forNWatermarks" min={ 1 } max={ maxWatermarks }
                     value={ formData.nWatermarks } onChange={ this.onChangeFormData('nWatermarks') }/>
            </div>
          </div>
          <div className="col-12 col-lg-4 container">
            <div className="form-group">
              <div className="airglow-canvas-container">
                <canvas className="airglow-canvas" width={ 10 } height={ 10 } ref={ this.canvases.original }/>
              </div>
              <div className="airglow-file form-group input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">Original Image</span>
                </div>
                <div className="custom-file">
                  <input type="file" className="custom-file-input"
                         onChange={ this.onChangeFile('original') }/>
                  <label className="custom-file-label" htmlFor="inputGroupOriginalImage">{
                    images.original === null ? '' : `${ images.original.width }*${ images.original.height }`
                  }</label>
                </div>
              </div>
            </div>
            <div className="form-group">
              <div className="input-group">
                <div className="input-group-prepend">
                  <label className="input-group-text" htmlFor="formSecretKey">Secret Key</label>
                </div>
                <input type="text" className="form-control" id="formSecretKey"
                       value={ formData.secretKey } onChange={ this.onChangeFormData('secretKey') }/>
              </div>
              <small className="form-text text-muted">
                A secret key used to encrypt the data.
              </small>
            </div>
            <div className="form-group">
              <label htmlFor="forAlpha">Alpha: { parseFloat(formData.alpha) / 100 }</label>
              <input type="range" className="custom-range" id="forAlpha" min={ 1 } max={ 100 }
                     value={ formData.alpha } onChange={ this.onChangeFormData('alpha') }/>
            </div>
            <div className="airglow-buttons form-group">
              <button className="airglow-button btn btn-primary"
                      disabled={ encodeDisabled }
                      onClick={ this.onEncode }>Encode!
              </button>
              <button className="airglow-button btn btn-primary"
                      disabled={ decodeDisabled }
                      onClick={ this.onDecode }>Decode!
              </button>
            </div>
          </div>
          <div className="col-12 col-lg-4 container">
            <div className="form-group">
              <div className="airglow-canvas-container">
                <canvas className="airglow-canvas" width={ 10 } height={ 10 } ref={ this.canvases.encoded }/>
              </div>
              <div className="airglow-file input-group">
                <div className="input-group-prepend">
                  <span className="input-group-text">Encoded Image</span>
                </div>
                <div className="custom-file">
                  <input type="file" className="custom-file-input"
                         onChange={ this.onChangeFile('encoded') }/>
                  <label className="custom-file-label" htmlFor="inputGroupEncodedImage">{
                    images.encoded === null ? '' : `${ images.encoded.width }*${ images.encoded.height }`
                  }</label>
                </div>
              </div>
            </div>
            <div className="airglow-buttons form-group">
              <button className="airglow-button btn btn-primary"
                      disabled={ images.encoded === null }
                      onClick={ this.onDownload('encoded') }>Download
              </button>
            </div>
          </div>
        </div>
      </form>
      <Footer/>
    </div>)
  }

  public onChangeFormData(key: keyof IAppFormData): (e: React.ChangeEvent<HTMLInputElement>) => void {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const formData = this.state.formData
      formData[key] = e.target.value
      this.setState({
        formData
      })
    }
  }
}

export default App
