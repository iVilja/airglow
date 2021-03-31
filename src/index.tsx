import * as React from 'react'
import * as ReactDOM from 'react-dom'
// import * as tf from '@tensorflow/tfjs'
// import '@tensorflow/tfjs-backend-wasm'

import App from './App'
import './index.css'
import registerServiceWorker from './registerServiceWorker'

// void tf.setBackend('wasm')

ReactDOM.render(
  <App/>,
  document.getElementById('root') as HTMLElement
)
registerServiceWorker()
