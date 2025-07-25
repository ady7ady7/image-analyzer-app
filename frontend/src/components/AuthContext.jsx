// frontend/src/components/AuthContext.jsx - SIMPLE VERSION THAT BUILDS
import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Simulate loading and set up offline user
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentUser({
        uid: 'offline-user',
        isAnonymous: true,
        getIdToken: () => Promise.resolve('offline-token')
      });
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  // Mock functions to match your existing API
  const updateUsageCount = async () => {
    return { success: true, usageCount: 0 };
  };

  const getUserData = async () => {
    return { usageCount: 0, isPro: false };
  };

  const signOut = async () => {
    setCurrentUser(null);
  };

  const retryConnection = async () => {
    setError(null);
    setCurrentUser({
      uid: 'offline-user',
      isAnonymous: true,
      getIdToken: () => Promise.resolve('offline-token')
    });
  };

  const value = {
    currentUser,
    loading,
    error,
    isFirebaseAvailable: false,
    updateUsageCount,
    getUserData,
    signOut,
    retryConnection,
    clearError: () => setError(null)
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
      {loading && (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-white text-lg">Initializing Application...</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};