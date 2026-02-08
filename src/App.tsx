import React, { lazy, Suspense } from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { User, LogOut } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

// Lazy load components
const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const MockInterview = lazy(() => import('./components/MockInterview').then(m => ({ default: m.MockInterview })));
const MCATStudy = lazy(() => import('./components/MCATStudy').then(m => ({ default: m.MCATStudy })));
const Scheduling = lazy(() => import('./components/Scheduling').then(m => ({ default: m.Scheduling })));
const Login = lazy(() => import('./pages/Login.jsx'));
const Register = lazy(() => import('./pages/Register.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const Profile = lazy(() => import('./pages/Profile'));
const Consultations = lazy(() => import('./pages/Consultations.jsx'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute.jsx'));

export default function App() {
  const { user, logout, loading } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(to bottom right, rgb(240, 249, 255), rgb(240, 253, 250))' }}>
      {/* Header */}
      <header style={{ background: 'white', borderBottom: '1px solid rgb(191, 219, 254)' }}>
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '4rem' }}>
            {/* Logo */}
            <Link
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                textDecoration: 'none',
                color: 'inherit',
                cursor: 'pointer',
              }}
            >
              <div style={{ background: 'linear-gradient(135deg, rgb(37, 99, 235), rgb(34, 197, 94))', padding: '0.5rem', borderRadius: '0.5rem', width: '1.5rem', height: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem' }}>
                📚
              </div>
              <h1 style={{ fontSize: '1.25rem', fontWeight: '600', color: 'rgb(17, 24, 39)' }}>MedStudent Pro</h1>
            </Link>

            {/* Navigation and Auth */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              {user && (
                <nav style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                  <Link
                    to="/"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      textDecoration: 'none',
                      border: 'none',
                      background: 'transparent',
                      color: 'rgb(75, 85, 99)',
                      cursor: 'pointer',
                      fontWeight: '400',
                    }}
                  >
                    <span>Home</span>
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
                      border: 'none',
                      background: 'transparent',
                      color: 'rgb(75, 85, 99)',
                      cursor: 'pointer',
                      fontWeight: '400',
                    }}
                  >
                    <span>Interview</span>
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
                      border: 'none',
                      background: 'transparent',
                      color: 'rgb(75, 85, 99)',
                      cursor: 'pointer',
                      fontWeight: '400',
                    }}
                  >
                    <span>Exams</span>
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
                      border: 'none',
                      background: 'transparent',
                      color: 'rgb(75, 85, 99)',
                      cursor: 'pointer',
                      fontWeight: '400',
                    }}
                  >
                    <span>Schedule</span>
                  </Link>
                </nav>
              )}

              {/* Profile Dropdown or Login Button */}
              {!loading && (
                user ? (
                  <DropdownMenu.Root>
                    <DropdownMenu.Trigger asChild>
                      <button
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '2.5rem',
                          height: '2.5rem',
                          borderRadius: '9999px',
                          background: 'rgb(219, 234, 254)',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'rgb(29, 78, 216)',
                        }}
                      >
                        <User size={20} />
                      </button>
                    </DropdownMenu.Trigger>
                    <DropdownMenu.Portal>
                      <DropdownMenu.Content
                        style={{
                          minWidth: '200px',
                          backgroundColor: 'white',
                          borderRadius: '0.5rem',
                          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                          zIndex: 50,
                          border: '1px solid rgb(229, 231, 235)',
                        }}
                        sideOffset={5}
                      >
                        <DropdownMenu.Item disabled style={{ padding: '0.75rem 1rem', color: 'rgb(107, 114, 128)', fontSize: '0.875rem' }}>
                          {user.email}
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator style={{ height: '1px', background: 'rgb(229, 231, 235)', margin: '0.5rem 0' }} />
                        <DropdownMenu.Item asChild>
                          <Link
                            to="/dashboard"
                            style={{
                              display: 'block',
                              padding: '0.75rem 1rem',
                              color: 'rgb(31, 41, 55)',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            Dashboard
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item asChild>
                          <Link
                            to="/profile"
                            style={{
                              display: 'block',
                              padding: '0.75rem 1rem',
                              color: 'rgb(31, 41, 55)',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                            }}
                          >
                            Profile & Sessions
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Separator style={{ height: '1px', background: 'rgb(229, 231, 235)', margin: '0.5rem 0' }} />
                        <DropdownMenu.Item asChild>
                          <button
                            onClick={handleLogout}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.5rem',
                              width: '100%',
                              padding: '0.75rem 1rem',
                              background: 'transparent',
                              border: 'none',
                              color: 'rgb(239, 68, 68)',
                              textDecoration: 'none',
                              cursor: 'pointer',
                              fontSize: '0.875rem',
                              textAlign: 'left',
                            }}
                          >
                            <LogOut size={16} />
                            Logout
                          </button>
                        </DropdownMenu.Item>
                      </DropdownMenu.Content>
                    </DropdownMenu.Portal>
                  </DropdownMenu.Root>
                ) : (
                  <Link
                    to="/login"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '0.5rem 1rem',
                      borderRadius: '0.5rem',
                      background: 'rgb(37, 99, 235)',
                      color: 'white',
                      textDecoration: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      fontSize: '0.875rem',
                    }}
                  >
                    Login
                  </Link>
                )
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '80rem', margin: '0 auto', padding: '2rem 1rem' }}>
        <ErrorBoundary>
          <Suspense fallback={
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite', width: '3rem', height: '3rem', borderRadius: '9999px', borderTop: '2px solid rgb(37, 99, 235)', borderRight: 'transparent', borderBottom: '2px solid rgb(37, 99, 235)', borderLeft: 'transparent' }}></div>
                <p style={{ marginTop: '1rem', color: 'rgb(107, 114, 128)' }}>Loading...</p>
              </div>
            </div>
          }>
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Home />} />
              <Route path="/login" element={user ? <Navigate to="/dashboard" replace /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/dashboard" replace /> : <Register />} />

              {/* Protected Routes */}
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/interview" element={<ProtectedRoute><MockInterview /></ProtectedRoute>} />
              <Route path="/mcat" element={<ProtectedRoute><MCATStudy /></ProtectedRoute>} />
              <Route path="/scheduling" element={<ProtectedRoute><Scheduling /></ProtectedRoute>} />
              <Route path="/consultations" element={<ProtectedRoute><Consultations /></ProtectedRoute>} />
              <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

              {/* Catch all */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
        </ErrorBoundary>
      </main>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
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
