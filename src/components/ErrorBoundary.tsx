import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-app-base text-[#1D1D1F] p-4">
          <div className="max-w-md w-full glass-card p-8 shadow-xl">
            <h2 className="text-xl font-semibold text-red-500 mb-4">Something went wrong</h2>
            <div className="bg-[#F5F5F7] p-4 rounded-xl overflow-auto max-h-64 text-sm text-[#86868B] font-mono border border-black/5">
              {this.state.error?.message}
            </div>
            <button
              onClick={() => window.location.reload()}
              className="mt-6 w-full btn-primary"
            >
              Reload application
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
