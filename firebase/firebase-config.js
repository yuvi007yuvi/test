// Firebase Configuration
// This file initializes Firebase services and makes them available globally

// Firebase configuration object
// Replace these values with your own Firebase project configuration
const firebaseConfig = {
    apiKey: "AIzaSyCjqEYmgTV9iH9bdovaQXET0P7rOui5TEM",
    authDomain: "attendance-dff2f.firebaseapp.com",
    projectId: "attendance-dff2f",
    storageBucket: "attendance-dff2f.firebasestorage.app",
    messagingSenderId: "1054692796471",
    appId: "1:1054692796471:web:4117c8c6c0f47f1e4db7b2",
    measurementId: "G-8LW2XB4W3H"
};

// Initialize Firebase
// Handle potential initialization errors
let app, analytics, db, storage, auth;

// Import Firebase modules and initialize services
import('https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js')
    .then((appModule) => {
        // Initialize Firebase app
        app = appModule.initializeApp(firebaseConfig);
        console.log('Firebase app initialized');
        
        // Import and initialize other services
        return Promise.all([
            import('https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js'),
            import('https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js'),
            import('https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js'),
            import('https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js')
        ]);
    })
    .then(([analyticsModule, firestoreModule, storageModule, authModule]) => {
        // Initialize Firebase services
        analytics = analyticsModule.getAnalytics(app);
        db = firestoreModule.getFirestore(app);
        storage = storageModule.getStorage(app);
        auth = authModule.getAuth(app);
        
        // Export services to global scope for use in other files
        window.db = db;
        window.storage = storage;
        window.auth = auth;
        window.firebase = { app, analytics };
        
        console.log('Firebase services initialized successfully');
        
        // Dispatch a custom event to notify that Firebase is ready
        window.dispatchEvent(new CustomEvent('firebaseReady'));
    })
    .catch((error) => {
        console.error('Error initializing Firebase:', error);
        showFirebaseError('Failed to initialize Firebase services. Please check your internet connection and try again.');
    });

// Show error notification function
function showFirebaseError(message) {
    // If we have the main app utilities, use them
    if (typeof window.showNotification === 'function') {
        window.showNotification(message, 'error');
    } else {
        // Fallback to console and alert
        console.error(message);
        // Only show alert in development
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            alert(message);
        }
    }
}

// Utility function to check Firebase connection
function checkFirebaseConnection() {
    if (!window.firebase) {
        console.warn('Firebase not initialized yet');
        return false;
    }
    
    // Test Firestore connection
    if (window.db) {
        console.log('Firestore connected');
    } else {
        console.warn('Firestore not connected');
    }
    
    // Test Auth connection
    if (window.auth) {
        console.log('Firebase Auth connected');
    } else {
        console.warn('Firebase Auth not connected');
    }
    
    // Test Storage connection
    if (window.storage) {
        console.log('Firebase Storage connected');
    } else {
        console.warn('Firebase Storage not connected');
    }
    
    return true;
}

// Check connection after a delay
setTimeout(checkFirebaseConnection, 3000);

// Export for use in other modules (if using module system)
export { app, analytics, db, storage, auth };