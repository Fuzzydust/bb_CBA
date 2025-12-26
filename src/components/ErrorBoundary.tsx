import { Component, ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-800 rounded-lg p-6 border border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-red-500/10 p-2 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              <h1 className="text-xl font-bold text-white">Application Error</h1>
            </div>
            <p className="text-slate-300 mb-4">
              Something went wrong. Please try refreshing the page.
            </p>
            <div className="bg-slate-900 rounded p-3 mb-4">
              <p className="text-red-400 text-sm font-mono break-all">
                {this.state.error?.message || 'Unknown error'}
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-amber-500 text-slate-900 font-bold py-2 px-4 rounded-lg hover:bg-amber-400 transition-colors"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
