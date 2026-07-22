/**
 * Firebase Setup & Configuration
 * 
 * Replace the values below with your Firebase Project config keys from the Firebase Console:
 * Project Settings -> General -> Your Apps -> Web App -> Firebase SDK snippet.
 */

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// Check if user has updated placeholder config
window.isFirebaseConfigured = function() {
  return firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY";
};

// Export config for DB service
window.firebaseConfig = firebaseConfig;
