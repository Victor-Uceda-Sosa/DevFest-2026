import React, { useState, lazy, Suspense } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Switch } from './components/ui/switch';
import { useTheme } from './contexts/ThemeContext';

// Lazy load components to catch import errors
const Home = lazy(() => import('./components/Home').then(m => ({ default: m.Home })));
const MockInterview = lazy(() => import('./components/MockInterview').then(m => ({ default: m.MockInterview })));
const MCATStudy = lazy(() => import('./components/MCATStudy').then(m => ({ default: m.MCATStudy })));
const Scheduling = lazy(() => import('./components/Scheduling').then(m => ({ default: m.Scheduling })));

type Page = 'home' | 'interview' | 'mcat' | 'scheduling';

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const { theme, toggleTheme } = useTheme();

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
    <div className="min-h-screen bg-background transition-colors duration-200">
      {/* Header */}
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo - Clickable */}
            <button 
              onClick={() => setCurrentPage('home')}
              className="flex items-center gap-3 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary rounded-lg p-1"
            >
              <div className="bg-gradient-to-br from-blue-600 to-cyan-600 p-2 rounded-lg w-8 h-8 flex items-center justify-center text-lg">
                🧠
              </div>
              <h1 className="text-xl font-semibold text-foreground tracking-tight">K2 Think</h1>
            </button>

            {/* Navigation and Theme Toggle */}
            <div className="flex items-center gap-4">
              <nav className="flex items-center gap-1">
                {(['home', 'interview', 'mcat', 'scheduling'] as const).map((page) => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      currentPage === page
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    {page === 'interview' ? 'Interview' : page === 'mcat' ? 'Exams' : page === 'scheduling' ? 'Schedule' : 'Home'}
                  </button>
                ))}
              </nav>

              {/* Theme Toggle */}
              <div className="flex items-center gap-2 pl-4 border-l border-border">
                <Sun className="w-4 h-4 text-muted-foreground" />
                <Switch 
                  checked={theme === 'dark'} 
                  onCheckedChange={toggleTheme}
                  aria-label="Toggle theme"
                />
                <Moon className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
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
        <div className="p-8 bg-destructive/10 border-2 border-destructive rounded-lg">
          <h3 className="text-xl text-destructive mb-4">Error Loading Component</h3>
          <pre className="text-muted-foreground text-sm overflow-auto">{String(this.state.error)}</pre>
        </div>
      );
    }

    return this.props.children;
  }
}
