import * as React from 'react'
import * as ReactDOM from 'react-dom'

import App from './App'
import './index.css'
import registerServiceWorker from './registerServiceWorker'

window.onOpenCVReady = async () => {
  delete window.onOpenCVReady
  // eslint-disable-next-line @typescript-eslint/await-thenable
  window.cv = await window.cv

  ReactDOM.render(
    <App/>,
    document.getElementById('root') as HTMLElement
  )
  registerServiceWorker()
}
