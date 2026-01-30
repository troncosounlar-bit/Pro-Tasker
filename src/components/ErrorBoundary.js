import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '50px', textAlign: 'center' }}>
          <h2>⚠️ Algo salió mal.</h2>
          <button onClick={() => window.location.reload()} style={styles.btn}>
            Recargar Aplicación
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const styles = {
  btn: { padding: '10px 20px', background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer' }
};

export default ErrorBoundary;