#!/usr/bin/env node

/**
 * Firebase Admin User Initialization Script
 * This script helps create an initial admin user for testing
 */

// This script should be run in the browser console or as part of the app
// For now, let's add instructions to the README

const adminSetupInstructions = `
Firebase Admin User Setup
=========================

To create an initial admin user for testing:

1. Open the registration page and register a normal user
2. In the Firebase Console, go to Firestore Database
3. Find the user document you just created
4. Add an 'isAdmin' field with value 'true' to the user document
5. Alternatively, create a document in the 'admins' collection with:
   - Document ID: [user's UID]
   - Fields:
     - userId: [user's UID]
     - name: [user's name]
     - email: [user's email]
     - isAdmin: true

For programmatic setup, you can use this code in the browser console after registering a user:

\`\`\`javascript
// After registering a user, get their UID from the authentication panel
// Then run this code:
const userId = 'USER_UID_HERE'; // Replace with actual UID
const db = firebase.firestore();

// Add user to admins collection
db.collection('admins').doc(userId).set({
  userId: userId,
  name: 'Admin User',
  email: 'admin@example.com',
  isAdmin: true
}).then(() => {
  console.log('Admin user created successfully');
}).catch((error) => {
  console.error('Error creating admin user:', error);
});

// Update user document to mark as admin
db.collection('users').doc(userId).update({
  role: 'admin'
}).then(() => {
  console.log('User role updated to admin');
}).catch((error) => {
  console.error('Error updating user role:', error);
});
\`\`\`

For production, you should implement proper admin user creation with authentication.
`;

console.log(adminSetupInstructions);