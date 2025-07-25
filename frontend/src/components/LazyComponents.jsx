// frontend/src/components/LazyComponents.jsx
// PERFORMANCE: Lazy loading setup for code-split chunks

import { lazy, Suspense } from 'react';
import { motion } from 'framer-motion';

// =============================================================================
// LOADING COMPONENTS
// =============================================================================

/**
 * Loading Spinner Component - Lightweight, loads immediately
 */
const LoadingSpinner = ({ message = "Loading..." }) => (
  <div className="flex flex-col items-center justify-center min-h-[200px] space-y-4">
    <motion.div
      className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full"
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
    />
    <motion.p 
      className="text-gray-400 text-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {message}
    </motion.p>
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
// LAZY LOADED COMPONENTS - MATCHING YOUR CHUNKS
// =============================================================================

// ANIMATIONS CHUNK - Loaded after initial render
export const LazyAnimatedComponents = {
  // Heavy animation components that use framer-motion extensively
  ParallaxBackground: lazy(() => 
    import('./animations/ParallaxBackground').catch(() => 
      import('./fallbacks/StaticBackground')
    )
  ),
  AnimatedTestimonials: lazy(() => 
    import('./animations/AnimatedTestimonials').catch(() => 
      import('./fallbacks/StaticTestimonials')
    )
  ),
  FloatingElements: lazy(() => 
    import('./animations/FloatingElements').catch(() => 
      import('./fallbacks/StaticElements')
    )
  )
};

// FIREBASE CHUNK - Loaded when authentication is needed
export const LazyFirebaseComponents = {
  AuthProvider: lazy(() => import('./AuthContext')),
  LoginModal: lazy(() => import('./auth/LoginModal')),
  UserProfile: lazy(() => import('./auth/UserProfile')),
  ProtectedRoute: lazy(() => import('./auth/ProtectedRoute'))
};

// UTILS CHUNK - Loaded when user interacts
export const LazyUtilComponents = {
  ImageUploader: lazy(() => import('./ImageUploader')),
  AnalysisForm: lazy(() => import('./AnalysisForm')),
  ResultsDisplay: lazy(() => import('./ResultsDisplay')),
  DebugPanel: lazy(() => import('./DebugPanel'))
};

// PAGES CHUNK - Loaded on route navigation
export const LazyPages = {
  Privacy: lazy(() => import('../pages/Privacy')),
  Terms: lazy(() => import('../pages/Terms')),
  NotFound: lazy(() => import('../pages/NotFound')),
  Dashboard: lazy(() => import('../pages/Dashboard'))
};

// =============================================================================
// WRAPPER COMPONENTS WITH SUSPENSE
// =============================================================================

/**
 * Suspense wrapper for animations chunk
 */
export const SuspenseAnimations = ({ children, fallback }) => (
  <Suspense fallback={fallback || <ChunkLoader chunkName="animations" />}>
    {children}
  </Suspense>
);

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
  animations: () => {
    // Preload framer-motion chunk
    import('framer-motion');
    Object.values(LazyAnimatedComponents).forEach(component => {
      component.preload?.();
    });
  },
  
  firebase: () => {
    // Preload firebase chunk
    import('firebase/app');
    import('firebase/auth');
    Object.values(LazyFirebaseComponents).forEach(component => {
      component.preload?.();
    });
  },
  
  utils: () => {
    // Preload utils chunk
    import('axios');
    import('react-dropzone');
    import('lucide-react');
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
  LazyAnimatedComponents,
  LazyFirebaseComponents,
  LazyUtilComponents,
  LazyPages,
  SuspenseAnimations,
  SuspenseFirebase,
  SuspenseUtils,
  SuspensePages,
  preloadChunks,
  useIntelligentPreloading
};