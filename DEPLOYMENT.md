# Deployment Guide

This guide explains how to properly deploy the Face Attendance System.

## Development vs Production

The application can run in two environments:

1. **Development** - Local testing on `localhost`
2. **Production** - Deployed to a web server or hosting platform

## Firebase Configuration

### 1. Update Firebase Project Settings

1. Go to the Firebase Console: https://console.firebase.google.com/
2. Select your project
3. Go to Project Settings
4. Add your domain to the "Authorized domains" list:
   - For GitHub Pages: `YOUR_USERNAME.github.io`
   - For custom domains: `yourdomain.com`

### 2. Update Storage Rules

In the Firebase Console:
1. Go to Storage
2. Click on "Rules" tab
3. Update the rules to allow your domain:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /{allPaths=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

### 3. Update Firestore Rules

In the Firebase Console:
1. Go to Firestore Database
2. Click on "Rules" tab
3. Update the rules to allow your domain:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## GitHub Pages Deployment

### 1. Fork the Repository

1. Fork this repository to your GitHub account
2. Clone your forked repository locally

### 2. Update Firebase Configuration

Update the Firebase configuration in `firebase/firebase-config.js` with your project settings:

```javascript
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID",
    measurementId: "YOUR_MEASUREMENT_ID"
};
```

### 3. Deploy to GitHub Pages

1. Push your changes to your GitHub repository
2. Go to Repository Settings
3. Scroll to "Pages" section
4. Select "GitHub Actions" as the source
5. The site will be deployed to `https://YOUR_USERNAME.github.io/YOUR_REPOSITORY_NAME/`

## Custom Domain Deployment

### 1. Configure Custom Domain

1. Purchase a domain from a registrar
2. Point your domain's DNS to your hosting provider
3. Update Firebase project settings to include your custom domain

### 2. Update Firebase Configuration

Follow the same steps as GitHub Pages deployment but with your custom domain.

## Local Development

### 1. Run Local Server

```bash
npx serve . -p 8000
```

### 2. Access Application

Open your browser and navigate to `http://localhost:8000`

## Troubleshooting

### CORS Errors

If you encounter CORS errors:

1. Ensure your domain is added to Firebase Authorized Domains
2. Check that your Firebase rules allow requests from your domain
3. Verify that you're using the correct Firebase project configuration

### Firebase Permission Errors

If you encounter permission errors:

1. Check that your Firestore and Storage rules are correctly configured
2. Ensure you have proper authentication set up
3. Verify that the user has the necessary permissions

### Face Detection Issues

If face detection is not working:

1. Check that the face-api.js models are properly loaded
2. Ensure the camera is accessible and permissions are granted
3. Verify that the lighting conditions are adequate
4. Check the browser console for any errors

## Security Considerations

For production deployment:

1. Restrict Firebase rules to only allow necessary operations
2. Implement proper user authentication
3. Use HTTPS for all connections
4. Regularly update dependencies
5. Monitor Firebase usage and set up billing alerts

## Production Rules Example

For production, use more restrictive rules:

### Firestore Rules

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
      allow update: if request.auth != null && request.auth.uid == userId;
      allow delete: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Storage Rules

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /face_images/{imageId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == imageId.replace('.jpg', '');
    }
  }
}
```

