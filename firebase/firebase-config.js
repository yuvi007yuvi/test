// Firebase Configuration
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";

// Your web app's Firebase configuration
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
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Initialize Firebase services
const db = getFirestore(app);
const storage = getStorage(app);
const auth = getAuth(app);

// Export for use in other files
window.db = db;
window.storage = storage;
window.auth = auth;
window.firebase = { app, analytics };
