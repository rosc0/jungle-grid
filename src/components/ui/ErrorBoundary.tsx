'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className='min-h-screen bg-gray-900 text-white flex items-center justify-center p-4'>
          <div className='max-w-md mx-auto text-center'>
            <h2 className='text-2xl font-bold text-red-500 mb-4'>Something went wrong</h2>
            <p className='text-gray-300 mb-6'>
              The audio sequencer encountered an unexpected error. This might be due to browser
              compatibility or audio context issues.
            </p>
            <div className='space-y-3'>
              <button
                onClick={() => window.location.reload()}
                className='w-full px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors'
              >
                Reload Page
              </button>
              <details className='text-left'>
                <summary className='cursor-pointer text-sm text-gray-400 hover:text-gray-300'>
                  Show Error Details
                </summary>
                <pre className='mt-2 p-3 bg-gray-800 rounded text-xs text-red-300 overflow-auto'>
                  {this.state.error?.toString()}
                </pre>
              </details>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
