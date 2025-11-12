import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { logError } from '../lib/monitoring';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError({
      type: 'react_error_boundary',
      message: error.message,
      metadata: {
        stack: error.stack,
        componentStack: errorInfo.componentStack
      }
    });
  }

  private handleRefresh = () => {
    window.location.reload();
  };

  private handleNavigateHome = () => {
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl p-8 max-w-md w-full">
            <div className="flex items-center space-x-4 mb-6">
              <div className="bg-red-100 p-2 rounded-full">
                <AlertCircle className="h-6 w-6 text-red-600" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900">
                Wystąpił błąd
              </h2>
            </div>
            <p className="text-gray-600 mb-6">
              Przepraszamy, wystąpił nieoczekiwany błąd. Spróbuj odświeżyć stronę lub skontaktuj się z administratorem.
            </p>
            <div className="space-y-4">
              <button
                onClick={this.handleRefresh}
                className="w-full bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Odśwież stronę
              </button>
              <button
                onClick={this.handleNavigateHome}
                className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors duration-200"
              >
                Wróć do strony głównej
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}