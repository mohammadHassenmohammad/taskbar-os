import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[Fitness OS Error Boundary Caught]:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '40px 24px',
          margin: '20px auto',
          maxWidth: 480,
          background: 'var(--bg-card, #12141f)',
          borderRadius: 24,
          border: '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
          textAlign: 'center',
          color: 'var(--text-primary, #fff)'
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', color: '#ef4444'
          }}>
            <AlertTriangle size={28} />
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, letterSpacing: '-0.5px' }}>
            Something went wrong
          </h3>
          <p style={{ fontSize: 13, color: 'var(--text-muted, #94a3b8)', marginBottom: 24, lineHeight: 1.5 }}>
            We couldn't load this section. An isolated runtime exception occurred.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button
              onClick={this.handleReset}
              className="btn btn-primary"
              style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '10px 20px', borderRadius: 12,
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                color: 'white', border: 'none', fontWeight: 800, fontSize: 13, cursor: 'pointer'
              }}
            >
              <RefreshCw size={14} /> Retry Section
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
