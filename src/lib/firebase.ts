
import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

/**
 * Initialize Firebase with configuration from localStorage or empty values
 * Users will need to provide their own Firebase config in the settings
 */
export const initializeFirebase = () => {
  // Try to get config from environment variables first
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || '',
  };

  // If environment variables are not set, try localStorage as fallback
  if (!firebaseConfig.apiKey) {
    const savedConfig = localStorage.getItem('firebase_config');
    if (savedConfig) {
      const parsedConfig = JSON.parse(savedConfig);
      Object.assign(firebaseConfig, parsedConfig);
    }
  }

  // Only initialize if apiKey exists
  if (firebaseConfig.apiKey) {
    try {
      const app = initializeApp(firebaseConfig);
      const firestore = getFirestore(app);
      const auth = getAuth(app);
      const storage = getStorage(app);

      return { app, firestore, auth, storage, isConfigured: true };
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      return { isConfigured: false, error };
    }
  } else {
    return { isConfigured: false };
  }
};

// Create a singleton instance to be used across the app
let firebaseInstance = null;

export const getFirebaseInstance = () => {
  if (!firebaseInstance) {
    firebaseInstance = initializeFirebase();
  }
  return firebaseInstance;
};

// Reset the Firebase instance (used when updating config)
export const resetFirebaseInstance = () => {
  firebaseInstance = null;
  return getFirebaseInstance();
};
