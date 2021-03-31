import 'bootstrap/dist/css/bootstrap.min.css'

import * as React from 'react'

import './Footer.css'

import { compareVersion, getCurrentVersion, isDevelopment } from './utils'

interface IFooterState {
  versionList: string[]
  currentVersion: string
}

export default class Footer extends React.Component<Record<string, never>, IFooterState> {
  private onVersionSelectedHandler = this.onVersionSelected.bind(this)

  constructor(props: Record<string, never>) {
    super(props)
    const currentVersion = getCurrentVersion()
    this.state = {
      currentVersion,
      versionList: [
        'latest',
        currentVersion
      ],
    }
  }

  private async fetchVersionList(): Promise<void> {
    if (isDevelopment) {
      return
    }
    try {
      const response = await fetch('/VERSIONS')
      const content = await response.text()
      const sorted = content.split('\n')
        .filter((x) => x.trim() !== '')
        .map((x) => x.startsWith('v') ? x.slice(1) : x)
        .sort(compareVersion)
      const versionList = sorted.filter((x, i) => i < 2 ||
        !x.startsWith(sorted[i - 1].split('.').slice(0, -1).join('.'))
      )
      this.setState({
        versionList
      })
    } catch {
      // eslint-disable-next-line no-console
      console.warn('Unable to fetch the version list.')
    }
  }

  public componentDidMount(): void {
    void this.fetchVersionList()
  }

  private onVersionSelected(e: React.ChangeEvent<HTMLSelectElement>): void {
    const version = e.target.value
    if (e.target && e.target.selectedIndex === 1) {
      window.location.pathname = '/stable'
    } else if (version === 'latest') {
      window.location.pathname = '/latest'
    } else {
      window.location.pathname = `/v${ version }`
    }
  }

  public render(): JSX.Element {
    return <footer className="footer mt-auto py-3">
      <div className="footer-container container">
        <div className="text-muted footer-block">By <a href="https://vilja.me">Vilja</a> @ <a
          href="https://github.com/commoon">Commoon Labs</a>.&nbsp;</div>
        <div className="text-muted footer-block">Source code on <a
          href={ process.env.REACT_APP_REPOSITORY }>GitHub</a>.&nbsp;</div>
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
