import 'bootstrap/dist/css/bootstrap.min.css'

import * as React from 'react'

import './App.css'

interface IAppState {
  formData: {
    secretKey: string
    alpha: number
  }
}

class App extends React.Component<{}, IAppState> {
  public canvasOriginal = React.createRef<HTMLCanvasElement>()
  public canvasSecret = React.createRef<HTMLCanvasElement>()

  public constructor(props: {}) {
    super(props)
    this.state = {
      formData: {
        alpha: 100,
        secretKey: ''
      }
    }
  }

  public onChangeFile(type: 'original' | 'secret') {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const canvas = type === 'original' ? this.canvasOriginal.current : this.canvasSecret.current
      if (canvas === null) {
        return
      }
      const files = (e.target as HTMLInputElement).files
      if (files === null || files.length < 1) {
        this.clearCanvas()
        return
      }
      const file = files[0]
      const image = new Image()
      const reader = new FileReader()
      image.onload = () => {
        canvas.width = image.width
        canvas.height = image.height
        const ctx = canvas.getContext('2d')
        ctx!.drawImage(image, 0, 0)
      }
      reader.onloadend = () => {
        if (reader.result !== null) {
          image.src = reader.result.toString()
        }
      }
      reader.readAsDataURL(file)
    }
  }

  public render() {
    const {formData} = this.state
    return (<div className="App">
      <form className="container">
        <div className="row">
          <div className="airglow-upload form-group col-md-6">
            <div className="airglow-canvas-container">
              <canvas className="airglow-canvas" width={ 10 } height={ 10 } ref={ this.canvasOriginal }/>
            </div>
            <label className="btn btn-primary">
              Upload <input type="file" onChange={ this.onChangeFile('original') } hidden={ true }/>
            </label>
          </div>
          <div className="airglow-upload form-group col-md-6">
            <div className="airglow-canvas-container">
              <canvas className="airglow-canvas" width={ 10 } height={ 10 } ref={ this.canvasSecret }/>
            </div>
            <label className="btn btn-primary">
              Upload <input type="file" onChange={ this.onChangeFile('secret') } hidden={ true }/>
            </label>
          </div>
        </div>
        <div className="form-group row">
          <input className="form-control" id="formSecretKey" type="text" placeholder="Secret Key"
                 value={ formData.secretKey } onChange={ this.onChangeFormData('secretKey') }/>
          <small className="form-text text-muted">
            A secret key used to encrypt the data.
          </small>
        </div>
        <div className="form-group row">
          <label htmlFor="forAlpha">Alpha: { formData.alpha / 100 }</label>
          <input type="range" className="form-control-range" id="forAlpha"
                 min={ 0 } max={ 100 } onChange={ this.onChangeFormData('alpha') }/>
        </div>
      </form>
    </div>)
  }

  public onChangeFormData(key: string) {
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      const formData = this.state.formData
      formData[key] = (e.target as HTMLInputElement).value
      this.setState({
        formData
      })
    }
  }

  private clearCanvas() {
    if (this.canvasOriginal.current === null) {
      return
    }
    const canvas = this.canvasOriginal.current
    canvas.width = 10
    canvas.height = 10
    const ctx = canvas.getContext('2d')
    ctx!.clearRect(0, 0, 10, 10)
  }
}

export default App
