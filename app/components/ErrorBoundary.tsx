'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { clientMonitoring } from '../lib/monitoring-client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (_error: Error, _errorInfo: ErrorInfo) => void;
  showDetails?: boolean;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    };
  }

  static getDerivedStateFromError(_error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error: _error,
      errorId: Math.random().toString(36).substring(2, 15),
    };
  }

  componentDidCatch(_error: Error, errorInfo: ErrorInfo) {
    // Log the error to client monitoring
    clientMonitoring.error('React Error Boundary caught error', {
      errorId: this.state.errorId,
      error: _error.message,
      stack: _error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
    });

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(_error, errorInfo);
    }

    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: '',
    });
  };

  handleReportError = () => {
    const { error, errorInfo, errorId } = this.state;
    
    // Log error report to client monitoring
    clientMonitoring.info('User reported error', {
      errorId,
      error: error?.message,
      componentStack: errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
    });

    // In a real application, you might send this to an error reporting service
    // console.log('Error reported:', {
    //   errorId,
    //   error: error?.message,
    //   stack: error?.stack,
    //   componentStack: errorInfo?.componentStack,
    // });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full">
              <svg
                className="w-6 h-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
            
            <div className="mt-4 text-center">
              <h3 className="text-lg font-medium text-gray-900">
                Something went wrong
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
              </p>
              
              {this.props.showDetails && this.state.error && (
                <details className="mt-4 text-left">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                    Error Details
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-600 overflow-auto max-h-32">
                    <div className="mb-2">
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div className="mb-2">
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    {this.state.error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 whitespace-pre-wrap">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </div>
            
            <div className="mt-6 flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
            </div>
            
            <div className="mt-4 text-center">
              <button
                onClick={this.handleReportError}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Report this error
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for error boundaries
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Partial<Props>
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary {...errorBoundaryProps}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}

// Hook for functional components to handle errors
export function useErrorHandler() {
  const [error, setError] = React.useState<Error | null>(null);

  const handleError = React.useCallback((error: Error) => {
    setError(error);
    
    // Log error to client monitoring
    clientMonitoring.error('Functional component error', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
}

// Async error boundary for async operations
export function useAsyncError() {
  const [, setError] = React.useState();
  return React.useCallback((e: Error) => {
    setError(() => {
      throw e;
    });
  }, []);
} 