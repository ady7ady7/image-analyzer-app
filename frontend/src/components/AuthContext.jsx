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
  const [currentUser, setCurrentUser] = useState({
    uid: 'offline-user',
    isAnonymous: true,
    getIdToken: () => Promise.resolve('offline-token')
  });
  const [loading, setLoading] = useState(false); // Changed to false - no loading delay
  const [error, setError] = useState(null);

  // No useEffect delay - user is available immediately

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
      {children}
    </AuthContext.Provider>
  );
};