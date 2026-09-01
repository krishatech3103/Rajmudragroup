import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Unhandled UI Exception caught by ErrorBoundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          background: '#0F172A',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          fontFamily: 'system-ui, sans-serif'
        }}>
          <div style={{
            background: '#1E293B',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 24,
            padding: 32,
            maxWidth: 480,
            textAlign: 'center',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{
              width: 60, height: 60, borderRadius: 20,
              background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#EF4444', display: 'flex', alignItems: 'center', justifyContent: 'center',
              margin: '0 auto 16px auto'
            }}>
              <AlertTriangle size={32} />
            </div>

            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8, color: '#ffffff' }}>
              राजमुद्रा मंडळ अॅप त्रुटी (App Exception)
            </h3>
            <p style={{ fontSize: 13, color: '#94A3B8', lineHeight: 1.5, marginBottom: 20 }}>
              An unexpected application error occurred. Your saved data is unaffected; reload to fetch a fresh view.
            </p>

            <button
              onClick={this.handleReload}
              style={{
                background: 'linear-gradient(135deg, #FF5722 0%, #F4511E 100%)',
                color: '#ffffff', border: 'none', borderRadius: 14,
                padding: '12px 24px', fontSize: 14, fontWeight: 800,
                cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
                boxShadow: '0 8px 20px rgba(255, 87, 34, 0.4)'
              }}
            >
              <RefreshCw size={16} /> Reload App (अॅप रीलोड करा)
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
