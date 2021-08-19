declare global {
  interface Window {
    onOpenCVReady?: () => Promise<void>
  }
}

export {}
