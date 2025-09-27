# Firebase Configuration for Face Attendance System

This document explains how to set up Firebase for the Face Attendance System.

## Firebase Project Setup

1. Create a new Firebase project at https://console.firebase.google.com/
2. Enable Firestore Database
3. Enable Firebase Storage
4. Enable Firebase Authentication (Email/Password)

## Firebase Configuration

The Firebase configuration is located in `firebase-config.js`:

```javascript
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-analytics.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
```

## Database Structure

### Users Collection
```
users/{userId}
├── name (string)
├── email (string)
├── role (string) - employee, manager, admin, student, teacher
├── faceDescriptor (array) - Face recognition data
├── faceImageUrl (string) - URL to face image in Storage
├── createdAt (timestamp)
└── isActive (boolean)
```

### Attendance Collection
```
attendance/{attendanceId}
├── userId (string) - Reference to user
├── timestamp (timestamp)
├── date (string) - YYYY-MM-DD
├── time (string) - HH:MM:SS
└── location (object, optional)
    ├── latitude (number)
    └── longitude (number)
```

### Admins Collection
```
admins/{adminId}
├── userId (string) - Reference to user
├── name (string)
└── email (string)
```

## Security Rules

### Firestore Rules (`firestore.rules`)
- Users can read/write their own data
- Admins can read/write all data
- Data validation for all fields

### Storage Rules (`storage.rules`)
- Users can read/write their own face images
- Admins can read all images

## Deployment

1. Install Firebase CLI:
   ```bash
   npm install -g firebase-tools
   ```

2. Login to Firebase:
   ```bash
   firebase login
   ```

3. Initialize Firebase project:
   ```bash
   firebase init
   ```

4. Deploy rules:
   ```bash
   firebase deploy --only firestore:rules
   firebase deploy --only storage
   ```

## Environment Variables

Set these environment variables in your Firebase project:

```
FIREBASE_API_KEY=your_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_STORAGE_BUCKET=your_project.appspot.com
FIREBASE_MESSAGING_SENDER_ID=your_sender_id
FIREBASE_APP_ID=your_app_id
```

## Testing

To test the Firebase configuration:

1. Create a test user through the registration page
2. Verify the user document is created in Firestore
3. Check that the face image is uploaded to Storage
4. Test attendance marking functionality

## Troubleshooting

### Common Issues

1. **Permission Denied**: Check that security rules are deployed correctly
2. **Authentication Failed**: Verify Firebase configuration in `firebase-config.js`
3. **Storage Upload Failed**: Ensure the user has proper permissions

### Debugging

Enable Firebase debugging in the browser console:
```javascript
localStorage.setItem('LOG_LEVEL', 'debug');
```

## Backup and Recovery

Regularly backup your Firestore data:
```bash
firebase firestore:backup gs://your-project-backup-bucket
```