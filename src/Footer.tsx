import 'bootstrap/dist/css/bootstrap.min.css'

import * as React from 'react'

import './Footer.css'

interface IFooterState {
  versionList: string[]
  currentVersion: string
}

function getCurrentVersion(): string {
  const versionNumber = process.env.REACT_APP_VERSION!
  const tmp = window.location.pathname.split('/')
  if (tmp.length > 1) {
    const s = tmp[1]
    if (s === 'latest') {
      return s
    } else if (s.startsWith('v')) {
      const v = s.slice(1)
      if (v !== versionNumber) {
        return '???'
      }
    }
  }
  return versionNumber
}

function compareVersion(a: string, b: string): number {
  if (a === 'latest') {
    return -1
  } else if (b === 'latest') {
    return 1
  }
  const regex = /^(\d+)\.(\d+)\.(\d+)$/
  const aa = a.match(regex)!
  const bb = b.match(regex)!
  for (const i of [1, 2, 3]) {
    const x = parseInt(aa[i])
    const y = parseInt(bb[i])
    if (x > y) {
      return -1
    } else if (x < y) {
      return 1
    }
  }
  return 0
}

export default class Footer extends React.Component<{}, IFooterState> {
  private onVersionSelectedHandler = this.onVersionSelected.bind(this)

  constructor (props: {}) {
    super(props)
    const currentVersion = getCurrentVersion()
    this.state = {
      currentVersion,
      versionList: [
        currentVersion
      ],
    }
  }

  private async fetchVersionList() {
    try {
      const response = await fetch('/VERSIONS')
      const content = await response.text()
      const versionList = content.split('\n').filter((x) => x.trim() !== '')
      versionList.sort(compareVersion)
      this.setState({
        versionList
      })
    } catch {
      // tslint:disable-next-line:no-console
      console.warn("Unable to fetch the version list.")
    }
  }

  public componentDidMount() {
    this.fetchVersionList()
  }

  private onVersionSelected(e: React.ChangeEvent<HTMLSelectElement>) {
    const version = e.target.value
    if (version === 'latest') {
      window.location.pathname = '/latest'
    } else {
      window.location.pathname = `/v${version}`
    }
  }

  public render() {
    return <footer className="footer mt-auto py-3">
      <div className="footer-container container">
        <div className="text-muted footer-block">By <a href="https://vilja.me">Vilja</a> @ <a href="https://github.com/commoon">Commoon Labs</a>.&nbsp;</div>
        <div className="text-muted footer-block">Source code on <a href={ process.env.REACT_APP_REPOSITORY! }>GitHub</a>.&nbsp;</div>
        <div className="footer-block">
          <span className="text-muted">Version: </span>
          <select className="custom-select custom-select-sm"
            value={ this.state.currentVersion } onChange={ this.onVersionSelectedHandler }>
            { this.state.versionList.map((version, i) => <option key={ i }
              value={ version }>{ version + (i === 1 ? ' (stable)' : '') }</option>) }
          </select>
        </div>
      </div>
    </footer>
  }
}
