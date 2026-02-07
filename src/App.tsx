import React, { useState, lazy, Suspense } from 'react';

// Lazy load components to catch import errors
const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const MockInterview = lazy(() => import('./components/MockInterview').then(m => ({ default: m.MockInterview })));
const MCATStudy = lazy(() => import('./components/MCATStudy').then(m => ({ default: m.MCATStudy })));
const Scheduling = lazy(() => import('./components/Scheduling').then(m => ({ default: m.Scheduling })));

type Page = 'home' | 'interview' | 'mcat' | 'scheduling';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <Home onNavigate={setCurrentPage} />
          </Suspense>
        );
      case 'interview':
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <MockInterview />
          </Suspense>
        );
      case 'mcat':
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <MCATStudy />
          </Suspense>
        );
      case 'scheduling':
        return (
          <Suspense fallback={<div>Loading...</div>}>
            <Scheduling />
          </Suspense>
        );
      default:
        return null;
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, rgb(240, 249, 255), rgb(240, 253, 250))' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid rgb(191, 219, 254)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(34, 197, 94))', padding: '0.5rem', borderRadius: '0.5rem', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                📚
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgb(17, 24, 39)' }}>MedStudent Pro</h1>
            </div>

            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {(['home', 'interview', 'mcat', 'scheduling'] as const).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    padding: '0.5rem 1rem',
                    borderRadius: '0.5rem',
                    border: 'none',
                    background: currentPage === page ? 'rgb(219, 234, 254)' : 'transparent',
                    color: currentPage === page ? 'rgb(29, 78, 216)' : 'rgb(75, 85, 99)',
                    cursor: 'pointer',
                    fontWeight: currentPage === page ? '500' : '400',
                  }}
                >
                  <span>{page === 'interview' ? 'Interview' : page === 'mcat' ? 'Exams' : page === 'scheduling' ? 'Schedule' : 'Home'}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <ErrorBoundary>
          {renderPage()}
        </ErrorBoundary>
      </main>
    </div>
  );
}

// Error Boundary to catch component errors
class ErrorBoundary extends React.Component<any, any> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', background: 'white', borderRadius: '0.5rem', border: '2px solid rgb(239, 68, 68)' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'rgb(239, 68, 68)', marginBottom: '1rem' }}>Error Loading Component</h3>
          <pre style={{ color: 'rgb(107, 114, 128)', fontSize: '0.875rem', overflow: 'auto' }}>{String(this.state.error)}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
