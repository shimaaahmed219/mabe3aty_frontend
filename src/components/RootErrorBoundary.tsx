import { Component, type ErrorInfo, type ReactNode } from 'react';

type Props = { children: ReactNode };

type State = { error: Error | null };

export class RootErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      const { error } = this.state;
      return (
        <div
          dir="rtl"
          className="min-h-screen bg-slate-100 p-6 text-slate-900"
          style={{ fontFamily: 'system-ui, sans-serif' }}
        >
          <h1 className="text-lg font-semibold mb-2">حدث خطأ ولم يُحمَّل التطبيق</h1>
          <p className="text-sm text-slate-600 mb-4 break-words">{error.message}</p>
          {import.meta.env.DEV && error.stack ? (
            <pre className="mb-4 max-h-48 overflow-auto rounded-lg bg-white p-3 text-xs border border-slate-200">
              {error.stack}
            </pre>
          ) : null}
          <button
            type="button"
            className="rounded-lg bg-[#093F85] px-4 py-2 text-sm font-medium text-white"
            onClick={() => window.location.reload()}
          >
            إعادة تحميل الصفحة
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
