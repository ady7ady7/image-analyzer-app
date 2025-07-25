// frontend/src/components/LazyComponents.jsx
// PERFORMANCE: Lazy loading setup for code-split chunks - FIXED FOR YOUR ACTUAL COMPONENTS

import { lazy, Suspense } from 'react';

// =============================================================================
// LOADING COMPONENTS
// =============================================================================

/**
 * Loading Spinner Component - Lightweight, loads immediately
 */
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
    <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
    <p className="text-gray-400 text-sm animate-fade-in" style={{ animationDelay: '0.5s', opacity: 0 }}>
      {message}
    </p>
  </div>
);

/**
 * Chunk Loading Indicator - Shows which chunk is loading
 */
const ChunkLoader = ({ chunkName, className = "" }) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <div className="glass-effect p-6 rounded-xl text-center">
      <LoadingSpinner message={`Loading ${chunkName}...`} />
    </div>
  </div>
);

// =============================================================================
// LAZY LOADED COMPONENTS - MATCHING YOUR ACTUAL PROJECT STRUCTURE
// =============================================================================

// FIREBASE CHUNK - Loaded when authentication is needed  
export const LazyFirebaseComponents = {
  AuthProvider: lazy(() => import('./AuthContext')),
  // Add other auth components when you create them
};

// UTILS CHUNK - Loaded when user interacts (YOUR ACTUAL COMPONENTS)
export const LazyUtilComponents = {
  ImageUploader: lazy(() => import('./ImageUploader')),
  AnalysisForm: lazy(() => import('./AnalysisForm')),
  GoalSelection: lazy(() => import('./GoalSelection')),
  EngineSelection: lazy(() => import('./EngineSelection')),
  CustomPromptInput: lazy(() => import('./CustomPromptInput')),
  FinalOutput: lazy(() => import('./FinalOutput')),
  DebugPanel: lazy(() => import('./DebugPanel').catch(() => ({ default: () => null }))), // Optional component
};

// PAGES CHUNK - Loaded on route navigation (YOUR ACTUAL PAGES ONLY)
export const LazyPages = {
  Privacy: lazy(() => import('../pages/Privacy')),
  Terms: lazy(() => import('../pages/Terms')),
  NotFound: lazy(() => import('../pages/NotFound')),
};

// =============================================================================
// WRAPPER COMPONENTS WITH SUSPENSE
// =============================================================================

/**
 * Suspense wrapper for Firebase chunk  
 */
export const SuspenseFirebase = ({ children, fallback }) => (
  <Suspense fallback={fallback || <ChunkLoader chunkName="authentication" />}>
    {children}
  </Suspense>
);

/**
 * Suspense wrapper for utils chunk
 */
export const SuspenseUtils = ({ children, fallback }) => (
  <Suspense fallback={fallback || <ChunkLoader chunkName="tools" />}>
    {children}
  </Suspense>
);

/**
 * Suspense wrapper for pages
 */
export const SuspensePages = ({ children, fallback }) => (
  <Suspense fallback={fallback || <ChunkLoader chunkName="page" />}>
    {children}
  </Suspense>
);

// =============================================================================
// PRELOADING UTILITIES
// =============================================================================

/**
 * Preload chunks on user interaction
 * Call this on hover/focus to preload chunks before they're needed
 */
export const preloadChunks = {
  firebase: () => {
    // Temporarily disabled Firebase preloading for build fix
    // import('../firebase/firebase').catch(() => {});
    Object.values(LazyFirebaseComponents).forEach(component => {
      component.preload?.();
    });
  },
  
  utils: () => {
    // Preload utils chunk
    import('axios').catch(() => {});
    import('react-dropzone').catch(() => {});
    import('lucide-react').catch(() => {});
    Object.values(LazyUtilComponents).forEach(component => {
      component.preload?.();
    });
  },
  
  pages: (pageName) => {
    // Preload specific page
    if (LazyPages[pageName]) {
      LazyPages[pageName].preload?.();
    }
  }
};

/**
 * Hook for intelligent preloading
 * Preloads chunks based on user behavior
 */
export const useIntelligentPreloading = () => {
  const preloadOnHover = (chunkName) => ({
    onMouseEnter: () => preloadChunks[chunkName]?.(),
    onFocus: () => preloadChunks[chunkName]?.()
  });
  
  return { preloadOnHover, preloadChunks };
};

export default {
  LoadingSpinner,
  ChunkLoader,
  LazyFirebaseComponents,
  LazyUtilComponents,
  LazyPages,
  SuspenseFirebase,
  SuspenseUtils,
  SuspensePages,
  preloadChunks,
  useIntelligentPreloading
};