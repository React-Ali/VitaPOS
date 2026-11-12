import React, { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        // ADDED fixed inset-0 and z-[9999] to force this OVER modals
        <div className="fixed inset-0 z-[9999] bg-slate-900 flex flex-col justify-center items-center p-8">
          <div className="bg-red-900/50 border border-red-500 p-8 rounded-xl max-w-2xl w-full">
            <h1 className="text-2xl font-bold mb-4 text-red-400">Oops! The app crashed.</h1>
            <p className="mb-4 text-slate-300">Please take a screenshot of this error and send it to the developer.</p>
            <pre className="bg-black/50 p-4 rounded text-sm text-red-300 overflow-x-auto whitespace-pre-wrap font-mono mb-6">
              {this.state.error?.toString()}
            </pre>
            <button onClick={() => window.location.reload()} className="bg-red-600 text-white px-6 py-2 rounded font-bold hover:bg-red-700">
              Reload Application
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}