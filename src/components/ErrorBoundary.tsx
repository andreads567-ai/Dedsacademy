import React from 'react';

export interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

// @ts-ignore
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  // @ts-ignore
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  constructor(props: ErrorBoundaryProps) {
    // @ts-ignore
    super(props);
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: any) {
    console.error('Uncaught error caught by Deds Academy ErrorBoundary:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleResetCache = () => {
    try {
      const keysToClear = [
        'deds_courses_list',
        'deds_instructors_list',
        'deds_coupons_list',
        'deds_support_tickets',
      ];
      keysToClear.forEach((k) => localStorage.removeItem(k));
    } catch {}
    window.location.href = '/';
  };

  public render() {
    // @ts-ignore
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0b0f17] text-white flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#151c28] border border-emerald-500/30 rounded-2xl p-6 sm:p-8 shadow-2xl text-center space-y-5">
            <div className="w-16 h-16 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 mx-auto flex items-center justify-center">
              <span className="material-symbols-outlined text-3xl">terminal</span>
            </div>

            <div>
              <h1 className="text-xl font-bold text-white">Deds Academy</h1>
              <p className="text-xs text-gray-400 mt-1">
                Identificamos uma oscilação temporária na interface.
              </p>
            </div>

            {/* @ts-ignore */}
            {this.state.error && (
              <div className="p-3 bg-[#0e141f] rounded-xl border border-white/5 text-left text-xs font-mono text-red-400 overflow-x-auto max-h-32">
                <span className="font-bold block text-gray-400 mb-1">Detalhes técnicos:</span>
                {/* @ts-ignore */}
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-all cursor-pointer shadow-md"
              >
                Recarregar Página
              </button>
              <button
                type="button"
                onClick={this.handleResetCache}
                className="w-full sm:flex-1 py-2.5 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold text-xs transition-all cursor-pointer border border-white/10"
              >
                Limpar Cache &amp; Início
              </button>
            </div>
          </div>
        </div>
      );
    }

    // @ts-ignore
    return this.props.children;
  }
}
