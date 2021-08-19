import React from "react"

import { Main } from "./components/Main"
import { Footer } from "./components/Footer"
import { getCurrentVersion } from "./utils/utils"

import "./App.css"

function App() {
  return (
    <div className="App">
      <h1>Airglow ({ getCurrentVersion() })</h1>
      <Main />
      <Footer />
    </div>
  )
}

export default App
