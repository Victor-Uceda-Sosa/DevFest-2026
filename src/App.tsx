import React, { lazy, Suspense } from 'react';
import { Routes, Route, Link, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { ChevronDown, LogOut, User } from 'lucide-react';
import logo from './assets/logo.png';

// Lazy load components to catch import errors
const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const MockInterview = lazy(() => import('./components/MockInterview').then(m => ({ default: m.MockInterview })));
const MCATStudy = lazy(() => import('./components/MCATStudy').then(m => ({ default: m.MCATStudy })));
const Scheduling = lazy(() => import('./components/Scheduling').then(m => ({ default: m.Scheduling })));
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.default })));
const Register = lazy(() => import('./pages/Register').then(m => ({ default: m.default })));
const Profile = lazy(() => import('./pages/Profile').then(m => ({ default: m.default })));

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: 'white' }}>Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

// Profile Dropdown Menu
function ProfileDropdown() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(false);

  if (!user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.5rem 1rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: 'rgba(0, 200, 255, 0.1)',
          color: 'rgb(0, 200, 255)',
          cursor: 'pointer',
          fontSize: '0.875rem',
        }}
      >
        <User size={16} />
        {user.email?.split('@')[0]}
        <ChevronDown size={16} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            right: 0,
            marginTop: '0.5rem',
            background: 'rgb(20, 30, 50)',
            border: '1px solid rgb(50, 80, 120)',
            borderRadius: '0.5rem',
            minWidth: '200px',
            zIndex: 1000,
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.3)',
          }}
        >
          <div style={{ padding: '0.75rem', borderBottom: '1px solid rgb(50, 80, 120)' }}>
            <div style={{ fontSize: '0.75rem', color: 'rgb(150, 180, 220)' }}>Logged in as</div>
            <div style={{ color: 'rgb(200, 220, 255)', fontWeight: '500' }}>{user.email}</div>
          </div>

          <Link
            to="/profile"
            onClick={() => setIsOpen(false)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              color: 'rgb(150, 180, 220)',
              textDecoration: 'none',
              fontSize: '0.875rem',
              borderBottom: '1px solid rgb(50, 80, 120)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(0, 200, 255, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <User size={16} />
            Profile & Sessions
          </Link>

          <button
            onClick={async () => {
              await logout();
              setIsOpen(false);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              background: 'transparent',
              border: 'none',
              color: 'rgb(239, 68, 68)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              textAlign: 'left',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <LogOut size={16} />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}

// Navigation Bar
function Header() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  return (
    <header style={{ background: 'rgb(5, 5, 15)', borderBottom: '1px solid rgb(30, 60, 90)' }}>
      <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
          <Link
            to="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.3rem',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <img src={logo} alt="Praxis Logo" style={{ height: '2.5rem', width: 'auto' }} />
            <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgb(0, 200, 255)' }}>Praxis</h1>
          </Link>

          {!isAuthPage && (
            <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
              {isAuthenticated && (
                <>
                  <Link
                    to="/"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      background: location.pathname === '/' ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                      color: location.pathname === '/' ? 'rgb(0, 200, 255)' : 'rgb(100, 150, 200)',
                      cursor: 'pointer',
                      fontWeight: location.pathname === '/' ? '500' : '400',
                    }}
                  >
                    Home
                  </Link>

                  <Link
                    to="/interview"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      background: location.pathname === '/interview' ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                      color: location.pathname === '/interview' ? 'rgb(0, 200, 255)' : 'rgb(100, 150, 200)',
                      cursor: 'pointer',
                      fontWeight: location.pathname === '/interview' ? '500' : '400',
                    }}
                  >
                    Interview
                  </Link>

                  <Link
                    to="/mcat"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      background: location.pathname === '/mcat' ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                      color: location.pathname === '/mcat' ? 'rgb(0, 200, 255)' : 'rgb(100, 150, 200)',
                      cursor: 'pointer',
                      fontWeight: location.pathname === '/mcat' ? '500' : '400',
                    }}
                  >
                    Exams
                  </Link>

                  <Link
                    to="/scheduling"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      background: location.pathname === '/scheduling' ? 'rgba(0, 200, 255, 0.1)' : 'transparent',
                      color: location.pathname === '/scheduling' ? 'rgb(0, 200, 255)' : 'rgb(100, 150, 200)',
                      cursor: 'pointer',
                      fontWeight: location.pathname === '/scheduling' ? '500' : '400',
                    }}
                  >
                    Schedule
                  </Link>
                </>
              )}
            </nav>
          )}

          <div>
            {isAuthenticated ? (
              <ProfileDropdown />
            ) : (
              <Link
                to="/login"
                style={{
                  padding: '0.5rem 1rem',
                  background: 'rgb(0, 150, 200)',
                  color: 'white',
                  borderRadius: '0.5rem',
                  textDecoration: 'none',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  border: 'none',
                }}
              >
                Login
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default function App() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'rgb(0, 0, 0)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'white', fontSize: '1.25rem' }}>Loading...</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'rgb(0, 0, 0)' }}>
      <Header />

      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <ErrorBoundary>
          <Suspense fallback={<div style={{ color: 'white', textAlign: 'center', padding: '2rem' }}>Loading...</div>}>
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Protected routes */}
              <Route
                path="/interview"
                element={
                  <ProtectedRoute>
                    <MockInterview />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/mcat"
                element={
                  <ProtectedRoute>
                    <MCATStudy />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/scheduling"
                element={
                  <ProtectedRoute>
                    <Scheduling />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* Default redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
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
        <div style={{ padding: '2rem', background: 'rgb(30, 40, 60)', borderRadius: '0.5rem', border: '2px solid rgb(239, 68, 68)' }}>
          <h3 style={{ fontSize: '1.25rem', color: 'rgb(239, 68, 68)', marginBottom: '1rem' }}>Error Loading Component</h3>
          <pre style={{ color: 'rgb(150, 180, 220)', fontSize: '0.875rem', overflow: 'auto' }}>{String(this.state.error)}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
