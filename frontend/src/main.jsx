// frontend/src/main.jsx - OPTIMIZED WITH PERFORMANCE CODE SPLITTING
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// PERFORMANCE: Import lazy loading utilities
import { 
  LazyPages, 
  LazyFirebaseComponents,
  SuspensePages, 
  SuspenseFirebase 
} from './components/LazyComponents';

/**
 * OPTIMIZED Main Application Router Setup
 * 
 * PERFORMANCE STRATEGY:
 * 1. React vendor chunk loads first (essential)
 * 2. Animations chunk loads after initial render
 * 3. Firebase chunk loads when authentication needed
 * 4. Utils chunk loads when user interacts
 * 
 * Features:
 * - Code-split route components
 * - Lazy-loaded authentication
 * - Intelligent preloading
 * - Fallback loading states
 */

// Simple loading fallback for critical pages
const PageLoader = ({ pageName }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div className="glass-effect p-8 rounded-xl text-center">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-300">Loading {pageName}...</p>
    </div>
  </div>
);

// Minimal auth loading fallback
const AuthLoader = () => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
    <div className="glass-effect p-6 rounded-xl">
      <div className="w-6 h-6 border-2 border-purple-400 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
      <p className="text-gray-300 text-sm">Loading authentication...</p>
    </div>
  </div>
);

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* MAIN APPLICATION ROUTE - Loads immediately with React vendor chunk */}
        <Route path="/" element={<App />} />
        
        {/* LAZY-LOADED LEGAL PAGES - Loaded on navigation */}
        <Route 
          path="/privacy" 
          element={
            <SuspensePages fallback={<PageLoader pageName="Privacy Policy" />}>
              <LazyPages.Privacy />
            </SuspensePages>
          } 
        />
        
        <Route 
          path="/terms" 
          element={
            <SuspensePages fallback={<PageLoader pageName="Terms of Service" />}>
              <LazyPages.Terms />
            </SuspensePages>
          } 
        />
        
        {/* DASHBOARD - Requires auth, loads Firebase chunk */}
        <Route 
          path="/dashboard" 
          element={
            <SuspensePages fallback={<PageLoader pageName="Dashboard" />}>
              <LazyPages.Dashboard />
            </SuspensePages>
          } 
        />
        
        {/* 404 ERROR PAGE - Lazy loaded, must be last */}
        <Route 
          path="*" 
          element={
            <SuspensePages fallback={<PageLoader pageName="Error Page" />}>
              <LazyPages.NotFound />
            </SuspensePages>
          } 
        />
      </Routes>
    </Router>
  );
};

/**
 * AUTH PROVIDER WRAPPER - Lazy loads Firebase chunk when needed
 */
const AppWithAuth = () => {
  // Check if auth is needed (can be optimized based on route)
  const needsAuth = window.location.pathname.includes('/dashboard') || 
                   localStorage.getItem('user_token');
  
  if (needsAuth) {
    return (
      <SuspenseFirebase fallback={<AuthLoader />}>
        <LazyFirebaseComponents.AuthProvider>
          <AppRouter />
        </LazyFirebaseComponents.AuthProvider>
      </SuspenseFirebase>
    );
  }
  
  // No auth needed, load app without Firebase chunk
  return <AppRouter />;
};

// =============================================================================
// PERFORMANCE: INTELLIGENT PRELOADING
// =============================================================================

/**
 * Preload chunks based on user behavior
 */
const setupIntelligentPreloading = () => {
  // Preload animations chunk after initial render
  setTimeout(() => {
    import('./components/LazyComponents').then(({ preloadChunks }) => {
      preloadChunks.animations();
    });
  }, 1000);
  
  // Preload utils on any user interaction
  const preloadUtils = () => {
    import('./components/LazyComponents').then(({ preloadChunks }) => {
      preloadChunks.utils();
    });
    // Remove listeners after first interaction
    document.removeEventListener('click', preloadUtils);
    document.removeEventListener('touchstart', preloadUtils);
    document.removeEventListener('keydown', preloadUtils);
  };
  
  document.addEventListener('click', preloadUtils, { once: true });
  document.addEventListener('touchstart', preloadUtils, { once: true });
  document.addEventListener('keydown', preloadUtils, { once: true });
  
  // Preload Firebase on auth-related actions
  const authButtons = document.querySelectorAll('[data-auth], [data-login], [data-signup]');
  authButtons.forEach(button => {
    button.addEventListener('mouseenter', () => {
      import('./components/LazyComponents').then(({ preloadChunks }) => {
        preloadChunks.firebase();
      });
    }, { once: true });
  });
};

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', () => {
  setupIntelligentPreloading();
});

// PERFORMANCE: Start React render
const root = createRoot(document.getElementById('root'));

root.render(
  <StrictMode>
    <AppWithAuth />
  </StrictMode>
);

// =============================================================================
// PERFORMANCE MONITORING (Development only)
// =============================================================================

if (import.meta.env.DEV) {
  // Monitor chunk loading performance
  const originalLog = console.log;
  console.log = (...args) => {
    if (args[0]?.includes?.('chunk')) {
      originalLog('🚀 Chunk loaded:', ...args);
    } else {
      originalLog(...args);
    }
  };
  
  // Log initial load time
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`🎯 Initial load completed in ${loadTime.toFixed(2)}ms`);
  });
}