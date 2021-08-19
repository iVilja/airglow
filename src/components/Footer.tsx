import "bootstrap/dist/css/bootstrap.min.css"

import { useState } from "react"
import { compareVersion, getCurrentVersion, isDevelopment } from "../utils/utils"

import "./Footer.css"

const fetchVersionList = async (): Promise<string[] | null> => {
  if (isDevelopment) {
    return null
  }
  try {
    const response = await fetch("/VERSIONS")
    const content = await response.text()
    const sorted = content.split("\n")
      .filter((x) => x.trim() !== "")
      .map((x) => x.startsWith("v") ? x.slice(1) : x)
      .sort(compareVersion)
    const versionList = sorted.filter((x, i) => i < 2 ||
      !x.startsWith(sorted[i - 1].split(".").slice(0, -1).join("."))
    )
    return versionList
  } catch {
    console.warn("Unable to fetch the version list.")
  }
  return null
}


export const Footer = (): JSX.Element => {
  const currentVersion = getCurrentVersion()
  const [ versionList, setVersionList ] = useState([ "dev", currentVersion ])
  fetchVersionList().then((vl) => {
    if (vl !== null) {
      setVersionList(vl)
    }
  })
  return <footer className="footer mt-auto py-3">
    <div className="footer-container container">
      <div className="text-muted footer-block">By <a href="https://vilja.me">Vilja</a> @ <a
        href="https://github.com/commoon">Commoon Labs</a>.&nbsp;</div>
      <div className="text-muted footer-block">Source code on <a
        href={ process.env.REACT_APP_REPOSITORY }>GitHub</a>.&nbsp;</div>
      <div className="footer-block">
        <span className="text-muted">Version: </span>
        <select className="form-select form-select-sm"
                value={ currentVersion }
                onChange={ (e) => {
                  const version = e.target.value
                  if (e.target && e.target.selectedIndex === 1) {
                    window.location.pathname = "/stable"
                  } else if (version === "dev") {
                    window.location.pathname = "/dev"
                  } else {
                    window.location.pathname = `/v${ version }`
                  }
                } }>
          { versionList.map((version, i) =>
            <option key={ i } value={ version }>
              { version + (i === 1 ? " (stable)" : "") }
            </option>) }
        </select>
      </div>
    </div>
  </footer>
}