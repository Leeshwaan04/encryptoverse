import React from 'react';

interface State {
  failed: boolean;
}

/** Last line of defence: if rendering throws (for example on malformed upstream data), show a recovery panel, not a blank page. */
export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  state: State = { failed: false };

  static getDerivedStateFromError(): State {
    return { failed: true };
  }

  componentDidCatch(error: Error) {
    console.error('Encryptoverse render error:', error.message);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="min-h-screen flex items-center justify-center px-6 text-center">
        <div className="max-w-md space-y-4">
          <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
          <p className="text-sm text-slate-300">The page hit an unexpected error. Reloading usually fixes it; if it keeps happening, please let us know.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="rounded-xl bg-cyan-400 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-cyan-300"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
