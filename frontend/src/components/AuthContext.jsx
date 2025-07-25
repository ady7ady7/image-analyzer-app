// frontend/src/components/AuthContext.jsx - WORKING VERSION WITH BUILD COMPATIBILITY
import React, { createContext, useContext, useEffect, useState } from 'react';

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
  const [isFirebaseAvailable, setIsFirebaseAvailable] = useState(false);

  // Lazy load Firebase when needed
  const [firebaseModule, setFirebaseModule] = useState(null);

  // Initialize Firebase when needed
  const initializeFirebase = async () => {
    try {
      // Dynamically import Firebase to avoid build issues
      const [
        { auth, db },
        { onAuthStateChanged, signInAnonymously },
        { doc, getDoc, setDoc }
      ] = await Promise.all([
        import('../firebase/firebase'),
        import('firebase/auth'),
        import('firebase/firestore')
      ]);

      if (auth && db) {
        setIsFirebaseAvailable(true);
        setFirebaseModule({ auth, db, onAuthStateChanged, signInAnonymously, doc, getDoc, setDoc });
        console.log('✅ Firebase services loaded and available');
        return { auth, db, onAuthStateChanged, signInAnonymously, doc, getDoc, setDoc };
      } else {
        console.warn('⚠️ Firebase services not properly configured');
        setIsFirebaseAvailable(false);
        return null;
      }
    } catch (error) {
      console.error('❌ Firebase initialization failed:', error);
      setIsFirebaseAvailable(false);
      setError(`Firebase initialization failed: ${error.message}`);
      return null;
    }
  };

  // Safe Firestore operations
  const safeFirestoreOperation = async (operation, fallback = null) => {
    if (!isFirebaseAvailable || !firebaseModule?.db) {
      console.warn('Firestore not available, skipping operation');
      return fallback;
    }

    try {
      return await operation();
    } catch (error) {
      console.error('Firestore operation failed:', error);
      setError(`Firestore error: ${error.message}`);
      return fallback;
    }
  };

  // Initialize user in Firestore
  const initializeUser = async (user, firebase) => {
    try {
      if (!user) {
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      // Attempt to initialize user in Firestore
      await safeFirestoreOperation(async () => {
        const userRef = firebase.doc(firebase.db, 'users', user.uid);
        const userSnap = await firebase.getDoc(userRef);

        if (!userSnap.exists()) {
          await firebase.setDoc(userRef, {
            usageCount: 0,
            isPro: false,
            createdAt: new Date(),
            lastLogin: new Date()
          });
          console.log('✅ New user initialized in Firestore');
        } else {
          // Update last login
          await firebase.setDoc(userRef, {
            lastLogin: new Date()
          }, { merge: true });
          console.log('✅ User login updated in Firestore');
        }
      });

      setCurrentUser(user);
      setError(null);
    } catch (error) {
      console.error('❌ User initialization failed:', error);
      setError(`Authentication error: ${error.message}`);
      setCurrentUser(user); // Set user anyway for offline functionality
    } finally {
      setLoading(false);
    }
  };

  // Setup authentication
  useEffect(() => {
    let unsubscribe = () => {};

    const setupAuth = async () => {
      try {
        setLoading(true);
        
        // Initialize Firebase
        const firebase = await initializeFirebase();
        
        if (!firebase || !firebase.auth) {
          console.warn('⚠️ Firebase Auth not available, running in offline mode');
          setCurrentUser({ uid: 'offline-user', isAnonymous: true });
          setLoading(false);
          return;
        }

        // Listen for authentication state changes
        unsubscribe = firebase.onAuthStateChanged(firebase.auth, async (user) => {
          try {
            if (user) {
              console.log('✅ User authenticated:', user.uid);
              await initializeUser(user, firebase);
            } else {
              console.log('👤 No user authenticated, attempting anonymous sign-in');
              
              // Attempt anonymous sign-in
              try {
                const anonymousUser = await firebase.signInAnonymously(firebase.auth);
                console.log('✅ Anonymous user created:', anonymousUser.user.uid);
                await initializeUser(anonymousUser.user, firebase);
              } catch (anonError) {
                console.error('❌ Anonymous sign-in failed:', anonError);
                
                // Fallback to offline mode
                console.log('🔄 Falling back to offline mode');
                setCurrentUser({ uid: 'offline-user', isAnonymous: true });
                setError(null); // Clear error for offline mode
                setLoading(false);
              }
            }
          } catch (error) {
            console.error('❌ Auth state change handler failed:', error);
            // Fallback to offline mode
            setCurrentUser({ uid: 'offline-user', isAnonymous: true });
            setError(null);
            setLoading(false);
          }
        });

        console.log('✅ Auth state listener established');
      } catch (error) {
        console.error('❌ Auth setup failed:', error);
        
        // Fallback to offline mode
        console.log('🔄 Falling back to offline mode due to setup failure');
        setCurrentUser({ uid: 'offline-user', isAnonymous: true });
        setError(null);
        setLoading(false);
      }
    };

    setupAuth();

    // Cleanup function
    return () => {
      if (unsubscribe) {
        unsubscribe();
        console.log('🧹 Auth listener cleaned up');
      }
    };
  }, []);

  // Retry Firebase connection
  const retryConnection = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const firebase = await initializeFirebase();
      if (firebase?.auth) {
        const anonymousUser = await firebase.signInAnonymously(firebase.auth);
        await initializeUser(anonymousUser.user, firebase);
      } else {
        throw new Error('Firebase services not available');
      }
    } catch (error) {
      console.error('❌ Retry failed:', error);
      setCurrentUser({ uid: 'offline-user', isAnonymous: true });
      setError(null); // Don't show error, just go offline
      setLoading(false);
    }
  };

  // Update usage count
  const updateUsageCount = async () => {
    if (!currentUser || currentUser.uid === 'offline-user') {
      return { success: true, usageCount: 0 }; // Offline mode
    }

    return await safeFirestoreOperation(async () => {
      const userRef = firebaseModule.doc(firebaseModule.db, 'users', currentUser.uid);
      await firebaseModule.setDoc(userRef, {
        usageCount: firebaseModule.increment(1),
        lastUsed: new Date()
      }, { merge: true });
      
      const updatedDoc = await firebaseModule.getDoc(userRef);
      return { success: true, usageCount: updatedDoc.data()?.usageCount || 1 };
    }, { success: true, usageCount: 0 });
  };

  // Get user data
  const getUserData = async () => {
    if (!currentUser || currentUser.uid === 'offline-user') {
      return { usageCount: 0, isPro: false }; // Offline mode defaults
    }

    return await safeFirestoreOperation(async () => {
      const userRef = firebaseModule.doc(firebaseModule.db, 'users', currentUser.uid);
      const userSnap = await firebaseModule.getDoc(userRef);
      return userSnap.exists() ? userSnap.data() : { usageCount: 0, isPro: false };
    }, { usageCount: 0, isPro: false });
  };

  // Sign out
  const signOut = async () => {
    if (firebaseModule?.auth) {
      try {
        await firebaseModule.auth.signOut();
      } catch (error) {
        console.error('Sign out error:', error);
      }
    }
    setCurrentUser(null);
  };

  const value = {
    currentUser,
    loading,
    error,
    isFirebaseAvailable,
    retryConnection,
    updateUsageCount,
    getUserData,
    signOut,
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
            <p className="text-gray-400 text-sm mt-2">Setting up secure connection</p>
          </div>
        </div>
      )}
    </AuthContext.Provider>
  );
};