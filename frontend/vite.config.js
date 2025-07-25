// frontend/vite.config.js - OPTIMIZED WITH PERFORMANCE CODE SPLITTING
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')
  
  const isDevelopment = mode === 'development'
  const isProduction = mode === 'production'
  
  return {
    plugins: [react()],
    
    // Development server configuration
    server: {
      port: 5173,
      open: true,
      cors: true,
      proxy: {
        // Proxy API calls to backend during development
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api/, '/api')
        },
        // Proxy health checks
        '/health': {
          target: env.VITE_API_URL || 'http://localhost:5000',
          changeOrigin: true,
          secure: false
        }
      },
      // HMR configuration
      hmr: {
        overlay: isDevelopment
      }
    },
    
    // Preview server configuration (for local production testing)
    preview: {
      port: 4173,
      open: true,
      cors: true
    },
    
    // Build configuration with OPTIMIZED CODE SPLITTING
    build: {
      outDir: 'dist',
      sourcemap: isDevelopment,
      minify: isProduction ? 'terser' : false,
      
      // PERFORMANCE OPTIMIZED: Chunk splitting for better caching and loading strategy
      rollupOptions: {
        output: {
          // PRIORITY LOADING STRATEGY - Exactly as requested
          manualChunks: (id) => {
            // 1. REACT VENDOR CHUNK - Essential, loaded first
            if (id.includes('node_modules/react') || 
                id.includes('node_modules/react-dom') ||
                id.includes('node_modules/react-router-dom')) {
              return 'react-vendor';
            }
            
            // 2. ANIMATIONS CHUNK - Loaded after initial render
            if (id.includes('node_modules/framer-motion')) {
              return 'animations';
            }
            
            // 3. FIREBASE CHUNK - Loaded when needed
            if (id.includes('node_modules/firebase') ||
                id.includes('src/firebase/') ||
                id.includes('src/components/AuthContext')) {
              return 'firebase';
            }
            
            // 4. UTILS CHUNK - Loaded when user interacts
            if (id.includes('node_modules/axios') ||
                id.includes('node_modules/react-dropzone') ||
                id.includes('node_modules/lucide-react') ||
                id.includes('node_modules/@headlessui/react') ||
                id.includes('node_modules/prop-types') ||
                id.includes('src/utils/')) {
              return 'utils';
            }
            
            // 5. VENDOR CHUNK - Other third-party libraries
            if (id.includes('node_modules')) {
              return 'vendor';
            }
            
            // 6. COMPONENTS CHUNK - Your components (loaded on demand)
            if (id.includes('src/components/') && 
                !id.includes('src/components/AuthContext')) {
              return 'components';
            }
            
            // 7. PAGES CHUNK - Your pages (loaded on route navigation)
            if (id.includes('src/pages/')) {
              return 'pages';
            }
          },
          
          // Asset file naming with performance optimization
          assetFileNames: (assetInfo) => {
            const info = assetInfo.name.split('.')
            const ext = info[info.length - 1]
            if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext)) {
              return `assets/images/[name]-[hash][extname]`
            }
            if (/css/i.test(ext)) {
              return `assets/styles/[name]-[hash][extname]`
            }
            return `assets/[name]-[hash][extname]`
          },
          chunkFileNames: 'assets/js/[name]-[hash].js',
          entryFileNames: 'assets/js/[name]-[hash].js'
        }
      },
      
      // Terser options for production
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
          pure_funcs: ['console.log', 'console.info']
        },
        mangle: true
      } : {},
      
      // Size warning limit (increased for chunked builds)
      chunkSizeWarningLimit: 1000,
      
      // Target modern browsers
      target: env.VITE_BUILD_TARGET || (isProduction ? 'es2015' : 'esnext'),
      
      // CSS code splitting
      cssCodeSplit: true
    },
    
    // PERFORMANCE: Dependency optimization for faster dev builds
    optimizeDeps: {
      include: [
        // Pre-bundle essential dependencies for faster cold starts
        'react',
        'react-dom',
        'react-router-dom'
      ],
      // Exclude heavy dependencies to be code-split
      exclude: [
        'framer-motion',      // Will be in animations chunk
        'firebase',           // Will be in firebase chunk
        'axios',              // Will be in utils chunk
        'react-dropzone',     // Will be in utils chunk
        'lucide-react'        // Will be in utils chunk
      ]
    },
    
    // Path resolution
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@components': resolve(__dirname, 'src/components'),
        '@pages': resolve(__dirname, 'src/pages'),
        '@utils': resolve(__dirname, 'src/utils'),
        '@hooks': resolve(__dirname, 'src/hooks'),
        '@assets': resolve(__dirname, 'src/assets'),
        '@firebase': resolve(__dirname, 'src/firebase')
      }
    },
    
    // CSS configuration
    css: {
      postcss: './postcss.config.js',
      devSourcemap: isDevelopment
    },
    
    // Environment variables
    define: {
      __DEV__: isDevelopment,
      __PROD__: isProduction,
      __VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    
    // Base URL for deployment
    base: env.VITE_BASE_URL || '/',
    
    // ESBuild configuration for performance
    esbuild: {
      target: 'esnext',
      drop: isProduction ? ['console', 'debugger'] : [],
      // Tree shaking optimization
      treeShaking: true
    }
  }
})