// frontend/src/main.jsx - SIMPLIFIED FOR WORKING BUILD
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Import AuthProvider directly
import { AuthProvider } from './components/AuthContext';

// PERFORMANCE: Import lazy loading utilities - ONLY for components that exist
import { 
  LazyPages, 
  SuspensePages
} from './components/LazyComponents';

/**
 * SIMPLIFIED Main Application Router Setup
 * Focus on getting the basic app working first
 */

// Simple loading fallback for pages
const PageLoader = ({ pageName }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
    <div className="glass-effect p-8 rounded-xl text-center">
      <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
      <p className="text-gray-300">Loading {pageName}...</p>
    </div>
  </div>
);

const AppRouter = () => {
  return (
    <Router>
      <Routes>
        {/* MAIN APPLICATION ROUTE - Loads immediately */}
        <Route path="/" element={<App />} />
        
        {/* LAZY-LOADED LEGAL PAGES */}
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
        
        {/* 404 ERROR PAGE - Must be last */}
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

// =============================================================================
// PERFORMANCE: SIMPLIFIED PRELOADING
// =============================================================================

const setupIntelligentPreloading = () => {
  // Preload utils on first user interaction
  const preloadUtils = () => {
    import('./components/LazyComponents').then(({ preloadChunks }) => {
      preloadChunks?.utils?.();
    }).catch(() => {
      // Fallback: preload individual utils manually
      import('./components/ImageUploader').catch(() => {});
      import('./components/AnalysisForm').catch(() => {});
      import('axios').catch(() => {});
      import('react-dropzone').catch(() => {});
    });
    
    // Remove listeners after first interaction
    document.removeEventListener('click', preloadUtils);
    document.removeEventListener('touchstart', preloadUtils);
    document.removeEventListener('keydown', preloadUtils);
  };
  
  document.addEventListener('click', preloadUtils, { once: true });
  document.addEventListener('touchstart', preloadUtils, { once: true });
  document.addEventListener('keydown', preloadUtils, { once: true });
};

// =============================================================================
// APPLICATION INITIALIZATION
// =============================================================================

// Simple initialization
const initializeApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('Root element not found!');
    return;
  }

  const root = createRoot(rootElement);

  root.render(
    <StrictMode>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </StrictMode>
  );

  // Setup preloading after render
  setupIntelligentPreloading();
  
  console.log('🚀 App initialized successfully');
};

// Wait for DOM or initialize immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// =============================================================================
// PERFORMANCE MONITORING (Development only)
// =============================================================================

if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    const loadTime = performance.now();
    console.log(`🎯 Initial load completed in ${loadTime.toFixed(2)}ms`);
  });
}