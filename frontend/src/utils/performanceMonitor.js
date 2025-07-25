// frontend/src/utils/performanceMonitor.js
// PERFORMANCE: Monitoring utility for code-split chunks

/**
 * Performance Monitor for Code-Split Chunks
 * Tracks loading times and provides insights for optimization
 */
class PerformanceMonitor {
  constructor() {
    this.chunks = new Map();
    this.startTime = performance.now();
    this.isEnabled = import.meta.env.DEV || localStorage.getItem('perf_monitor') === 'true';
    
    if (this.isEnabled) {
      this.setupMonitoring();
    }
  }
  
  /**
   * Setup performance monitoring
   */
  setupMonitoring() {
    // Monitor chunk loading via network requests
    this.interceptNetworkRequests();
    
    // Monitor React Suspense boundaries
    this.monitorSuspenseBoundaries();
    
    // Track initial load metrics
    this.trackInitialLoad();
    
    console.log('🔍 Performance monitoring enabled');
  }
  
  /**
   * Intercept network requests to track chunk loading
   */
  interceptNetworkRequests() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      const url = args[0];
      
      // Track chunk loading
      if (typeof url === 'string' && url.includes('/assets/js/')) {
        const chunkName = this.extractChunkName(url);
        const startTime = performance.now();
        
        try {
          const response = await originalFetch(...args);
          const endTime = performance.now();
          
          this.recordChunkLoad(chunkName, startTime, endTime, response.ok);
          return response;
        } catch (error) {
          const endTime = performance.now();
          this.recordChunkLoad(chunkName, startTime, endTime, false);
          throw error;
        }
      }
      
      return originalFetch(...args);
    };
  }
  
  /**
   * Extract chunk name from URL
   */
  extractChunkName(url) {
    const matches = url.match(/\/([a-zA-Z-]+)-[a-f0-9]+\.js$/);
    return matches ? matches[1] : 'unknown';
  }
  
  /**
   * Record chunk loading metrics
   */
  recordChunkLoad(chunkName, startTime, endTime, success) {
    const loadTime = endTime - startTime;
    const fromAppStart = startTime - this.startTime;
    
    this.chunks.set(chunkName, {
      name: chunkName,
      loadTime,
      fromAppStart,
      success,
      timestamp: new Date().toISOString()
    });
    
    this.logChunkMetrics(chunkName, loadTime, fromAppStart, success);
  }
  
  /**
   * Log chunk metrics to console
   */
  logChunkMetrics(chunkName, loadTime, fromAppStart, success) {
    const statusIcon = success ? '✅' : '❌';
    const priorityIcon = this.getChunkPriorityIcon(chunkName);
    
    console.log(
      `${statusIcon} ${priorityIcon} Chunk loaded: ${chunkName}`,
      `\n  ⏱️  Load time: ${loadTime.toFixed(2)}ms`,
      `\n  🚀 From app start: ${fromAppStart.toFixed(2)}ms`,
      `\n  📊 Priority: ${this.getChunkPriority(chunkName)}`
    );
  }
  
  /**
   * Get chunk priority icon
   */
  getChunkPriorityIcon(chunkName) {
    const priorities = {
      'react-vendor': '🔴', // Critical
      'animations': '🟡',   // After render
      'firebase': '🟠',     // When needed
      'utils': '🔵',        // On interaction
      'components': '🟢',   // On demand
      'pages': '🟣'         // On navigation
    };
    
    return priorities[chunkName] || '⚪';
  }
  
  /**
   * Get chunk priority level
   */
  getChunkPriority(chunkName) {
    const priorities = {
      'react-vendor': 'Critical (loads first)',
      'animations': 'High (after render)',
      'firebase': 'Medium (when needed)',
      'utils': 'Medium (on interaction)',
      'components': 'Low (on demand)',
      'pages': 'Low (on navigation)'
    };
    
    return priorities[chunkName] || 'Unknown';
  }
  
  /**
   * Monitor React Suspense boundaries
   */
  monitorSuspenseBoundaries() {
    // Track when Suspense components start/end loading
    const originalError = console.error;
    
    console.error = (...args) => {
      if (args[0]?.includes?.('Suspense')) {
        console.log('🔄 Suspense boundary triggered:', ...args);
      }
      return originalError(...args);
    };
  }
  
  /**
   * Track initial load metrics
   */
  trackInitialLoad() {
    window.addEventListener('load', () => {
      const totalLoadTime = performance.now() - this.startTime;
      
      console.group('📈 Performance Summary');
      console.log(`🎯 Total load time: ${totalLoadTime.toFixed(2)}ms`);
      console.log(`📦 Chunks loaded: ${this.chunks.size}`);
      
      // Sort chunks by load order
      const sortedChunks = Array.from(this.chunks.values())
        .sort((a, b) => a.fromAppStart - b.fromAppStart);
      
      console.table(sortedChunks);
      console.groupEnd();
      
      // Performance recommendations
      this.provideRecommendations(totalLoadTime);
    });
  }
  
  /**
   * Provide performance recommendations
   */
  provideRecommendations(totalLoadTime) {
    const recommendations = [];
    
    if (totalLoadTime > 3000) {
      recommendations.push('🐌 Consider reducing bundle size or optimizing critical path');
    }
    
    if (this.chunks.has('firebase') && this.chunks.get('firebase').fromAppStart < 1000) {
      recommendations.push('🔥 Firebase loaded early - consider lazy loading');
    }
    
    if (this.chunks.has('animations') && this.chunks.get('animations').fromAppStart < 500) {
      recommendations.push('🎨 Animations loaded early - consider delaying until after render');
    }
    
    if (recommendations.length > 0) {
      console.group('💡 Performance Recommendations');
      recommendations.forEach(rec => console.log(rec));
      console.groupEnd();
    }
  }
  
  /**
   * Get performance report
   */
  getReport() {
    return {
      chunks: Array.from(this.chunks.values()),
      totalChunks: this.chunks.size,
      totalLoadTime: performance.now() - this.startTime,
      loadOrder: Array.from(this.chunks.values())
        .sort((a, b) => a.fromAppStart - b.fromAppStart)
        .map(chunk => chunk.name)
    };
  }
  
  /**
   * Export performance data for analysis
   */
  exportData() {
    const report = this.getReport();
    const dataStr = JSON.stringify(report, null, 2);
    
    if (navigator.clipboard) {
      navigator.clipboard.writeText(dataStr);
      console.log('📋 Performance data copied to clipboard');
    } else {
      console.log('📊 Performance Data:', dataStr);
    }
    
    return report;
  }
}

// =============================================================================
// PERFORMANCE UTILITIES
// =============================================================================

/**
 * Measure component render time
 */
export const measureRender = (componentName, renderFn) => {
  const startTime = performance.now();
  const result = renderFn();
  const endTime = performance.now();
  
  console.log(`⚡ ${componentName} render: ${(endTime - startTime).toFixed(2)}ms`);
  
  return result;
};

/**
 * Measure async operation time
 */
export const measureAsync = async (operationName, asyncFn) => {
  const startTime = performance.now();
  try {
    const result = await asyncFn();
    const endTime = performance.now();
    console.log(`⚡ ${operationName}: ${(endTime - startTime).toFixed(2)}ms`);
    return result;
  } catch (error) {
    const endTime = performance.now();
    console.log(`❌ ${operationName} failed after ${(endTime - startTime).toFixed(2)}ms`);
    throw error;
  }
};

/**
 * Track chunk preloading effectiveness
 */
export const trackPreloadEffectiveness = () => {
  const preloadTimes = new Map();
  
  return {
    markPreloadStart: (chunkName) => {
      preloadTimes.set(chunkName, performance.now());
    },
    
    markPreloadEnd: (chunkName) => {
      const startTime = preloadTimes.get(chunkName);
      if (startTime) {
        const preloadTime = performance.now() - startTime;
        console.log(`🎯 Preload effectiveness - ${chunkName}: ${preloadTime.toFixed(2)}ms`);
        preloadTimes.delete(chunkName);
      }
    }
  };
};

// =============================================================================
// INITIALIZATION
// =============================================================================

// Create global performance monitor instance
const performanceMonitor = new PerformanceMonitor();

// Expose utilities for debugging
if (import.meta.env.DEV) {
  window.perfMonitor = performanceMonitor;
  window.exportPerfData = () => performanceMonitor.exportData();
}

export default performanceMonitor;