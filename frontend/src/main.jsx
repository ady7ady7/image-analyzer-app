// frontend/src/main.jsx - SIMPLE VERSION FOR FCP FIX
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import App from './App.jsx';
import './index.css';

// Import AuthProvider directly
import { AuthProvider } from './components/AuthContext';

// Simple router without lazy loading for now
const AppRouter = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/privacy" element={<div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center text-white"><h1>Privacy Policy</h1></div>} />
        <Route path="/terms" element={<div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center text-white"><h1>Terms of Service</h1></div>} />
        <Route path="*" element={<div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center text-white"><h1>404 Not Found</h1></div>} />
      </Routes>
    </Router>
  );
};

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
  
  console.log('🚀 App initialized successfully');
};

// Initialize immediately
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}