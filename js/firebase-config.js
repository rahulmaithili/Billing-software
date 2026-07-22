/**
 * Firebase Setup & Configuration
 * Project: billing-software-90d7c
 */

const firebaseConfig = {
  apiKey: "AIzaSyDKfpmqfinHp5zxPqZtNpsureFA9wAM-P8",
  authDomain: "billing-software-90d7c.firebaseapp.com",
  projectId: "billing-software-90d7c",
  storageBucket: "billing-software-90d7c.firebasestorage.app",
  messagingSenderId: "6798483772",
  appId: "1:6798483772:web:1d069356ae4ec2565a7e39"
};

// Check if user has updated placeholder config
window.isFirebaseConfigured = function() {
  return true;
};

// Export config for DB service
window.firebaseConfig = firebaseConfig;
