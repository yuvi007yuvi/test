#!/usr/bin/env node

/**
 * Firebase Rules Deployment Script
 * This script helps deploy Firebase security rules for development
 */

const fs = require('fs');
const path = require('path');

console.log('🚀 Firebase Rules Deployment Script');
console.log('====================================\n');

// Check if Firebase CLI is installed
try {
    require('child_process').execSync('firebase --version', { stdio: 'ignore' });
    console.log('✅ Firebase CLI is installed');
} catch (error) {
    console.log('⚠️  Firebase CLI not found');
    console.log('Please install Firebase CLI:');
    console.log('npm install -g firebase-tools\n');
    process.exit(1);
}

// Check if we're in a Firebase project directory
if (!fs.existsSync('firebase.json')) {
    console.log('⚠️  firebase.json not found');
    console.log('Please run this script from your Firebase project root directory\n');
    process.exit(1);
}

// Deploy Firestore rules
console.log('📦 Deploying Firestore rules...');
try {
    require('child_process').execSync('firebase deploy --only firestore:rules', { stdio: 'inherit' });
    console.log('✅ Firestore rules deployed successfully\n');
} catch (error) {
    console.log('❌ Failed to deploy Firestore rules:');
    console.log(error.message);
}

// Deploy Storage rules
console.log('📦 Deploying Storage rules...');
try {
    require('child_process').execSync('firebase deploy --only storage', { stdio: 'inherit' });
    console.log('✅ Storage rules deployed successfully\n');
} catch (error) {
    console.log('❌ Failed to deploy Storage rules:');
    console.log(error.message);
}

console.log('🎉 Firebase rules deployment completed!');
console.log('\nNext steps:');
console.log('1. Test the registration functionality');
console.log('2. Create your first admin user through the admin dashboard');
console.log('3. For production, update the rules to restrict access appropriately\n');

// Create a firebase.json file if it doesn't exist
const firebaseJsonPath = 'firebase.json';
if (!fs.existsSync(firebaseJsonPath)) {
    const firebaseConfig = {
        "firestore": {
            "rules": "firebase/firestore.rules"
        },
        "storage": {
            "rules": "firebase/storage.rules"
        }
    };
    
    fs.writeFileSync(firebaseJsonPath, JSON.stringify(firebaseConfig, null, 2));
    console.log('📝 Created firebase.json configuration file');
}