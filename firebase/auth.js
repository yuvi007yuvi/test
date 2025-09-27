// Firebase Authentication utilities

class AuthManager {
    constructor() {
        this.auth = firebase.auth();
        this.currentUser = null;
        this.init();
    }

    init() {
        // Listen for auth state changes
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                console.log('User signed in:', user.email);
                this.onUserSignedIn(user);
            } else {
                console.log('User signed out');
                this.onUserSignedOut();
            }
        });
    }

    // Sign in with email and password
    async signIn(email, password) {
        try {
            const result = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    // Sign out
    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    // Check if user is admin
    async isAdmin(user) {
        if (!user) return false;
        
        try {
            const userDoc = await db.collection('users').doc(user.uid).get();
            if (userDoc.exists) {
                const userData = userDoc.data();
                return userData.role === 'admin';
            }
            return false;
        } catch (error) {
            console.error('Error checking admin status:', error);
            return false;
        }
    }

    // Create admin user (for initial setup)
    async createAdminUser(email, password, name) {
        try {
            // Create user with Firebase Auth
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);
            const user = userCredential.user;

            // Update user profile
            await user.updateProfile({
                displayName: name
            });

            // Save user data to Firestore
            await db.collection('users').doc(user.uid).set({
                name: name,
                email: email,
                role: 'admin',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                isActive: true
            });

            return { success: true, user: user };
        } catch (error) {
            console.error('Create admin error:', error);
            return { success: false, error: error.message };
        }
    }

    // Callback when user signs in
    onUserSignedIn(user) {
        // Override this method in specific pages
        console.log('User signed in callback:', user);
    }

    // Callback when user signs out
    onUserSignedOut() {
        // Override this method in specific pages
        console.log('User signed out callback');
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }
}

// Initialize auth manager
window.authManager = new AuthManager();
