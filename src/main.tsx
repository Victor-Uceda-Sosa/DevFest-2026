import { createRoot } from 'react-dom/client';
import React, { useEffect, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import './index.css';

function AppLoader() {
  const [error, setError] = useState<string | null>(null);
  const [App, setApp] = useState<any>(null);

  useEffect(() => {
    import('./App.tsx')
      .then((module) => {
        console.log('App imported successfully');
        setApp(() => module.default);
      })
      .catch((e) => {
        console.error('Error importing App:', e);
        setError(String(e));
      });
  }, []);

  if (error) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: '#dc2626',
        color: 'white',
        padding: '40px',
        boxSizing: 'border-box',
        fontFamily: 'monospace',
        overflowY: 'auto'
      }}>
        <h1>❌ Error Importing App</h1>
        <pre style={{ whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>{error}</pre>
      </div>
    );
  }

  if (!App) {
    return (
      <div style={{
        width: '100%',
        height: '100vh',
        background: '#3b82f6',
        color: 'white',
        padding: '40px',
        boxSizing: 'border-box',
        fontFamily: 'Arial, sans-serif'
      }}>
        <h1>⏳ Loading App...</h1>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  );
}

const root = document.getElementById('root');
if (root) {
  createRoot(root).render(<AppLoader />);
} else {
  document.body.innerHTML = '<h1 style="color:red">ERROR: root element not found</h1>';
}
