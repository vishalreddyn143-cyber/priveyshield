import { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('PrivyShield ErrorBoundary caught an unhandled exception:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div
          role="alert"
          aria-live="assertive"
          className="min-h-screen flex items-center justify-center bg-[#050816] p-6 text-slate-100"
        >
          <div className="glass-panel max-w-lg w-full rounded-2xl border border-rose-500/40 p-8 shadow-[0_0_50px_rgba(244,63,94,0.2)] text-center space-y-5">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-rose-500/50 bg-rose-500/10 text-rose-400">
              <ShieldAlert className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h1 className="text-xl font-extrabold text-white">PrivyShield Shield Guard</h1>
              <p className="text-sm text-slate-300">
                A localized runtime error occurred in browser memory. Your documents and data remain strictly local and private.
              </p>
            </div>

            {this.state.error && (
              <div className="rounded-xl border border-slate-800 bg-slate-950/80 p-3 text-left font-mono text-xs text-rose-300 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}

            <button
              type="button"
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-500/25 transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-rose-400"
            >
              <RefreshCw className="h-4 w-4" />
              Reload Workspace Safely
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
