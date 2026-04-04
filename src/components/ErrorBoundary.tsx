import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('SIGMA Error:', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh', background: '#0a0a0a',
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif', padding: 24,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>⚠️</div>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 800, marginBottom: 8 }}>
            SIGMA crashed
          </h1>
          <p style={{ color: '#666', fontSize: 14, marginBottom: 24, textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'An unexpected error occurred.'}
          </p>
          <div style={{
            background: '#111', border: '1px solid #222',
            borderRadius: 10, padding: '12px 16px',
            marginBottom: 24, maxWidth: 500, width: '100%',
          }}>
            <p style={{ color: '#555', fontSize: 11, marginBottom: 6, fontWeight: 700, letterSpacing: '0.1em' }}>
              LIKELY FIX
            </p>
            <p style={{ color: '#aaa', fontSize: 13 }}>
              Make sure your <code style={{ color: '#6b7280', background: '#1a1a1a', padding: '2px 6px', borderRadius: 4 }}>.env</code> file
              exists in the project root with your Supabase URL and key.
            </p>
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#6b7280', color: '#000', border: 'none',
              borderRadius: 8, padding: '10px 24px', fontWeight: 700,
              fontSize: 14, cursor: 'pointer',
            }}
          >
            Reload App
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
