#!/usr/bin/env node

/**
 * Face Attendance System Setup Script
 * This script helps set up the project with necessary dependencies
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

console.log('🚀 Face Attendance System Setup');
console.log('================================\n');

// Create necessary directories
const directories = [
    'assets/images',
    'assets/icons',
    'lib/models'
];

console.log('📁 Creating directories...');
directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`   ✅ Created: ${dir}`);
    } else {
        console.log(`   ⚠️  Already exists: ${dir}`);
    }
});

// Download face-api.js library
console.log('\n📦 Downloading face-api.js library...');
const faceApiUrl = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
const faceApiPath = 'lib/face-api.min.js';

if (!fs.existsSync(faceApiPath)) {
    downloadFile(faceApiUrl, faceApiPath)
        .then(() => {
            console.log('   ✅ Downloaded face-api.min.js');
            console.log('\n🎉 Setup completed successfully!');
            console.log('\nNext steps:');
            console.log('1. Configure Firebase in firebase/firebase-config.js');
            console.log('2. Download face-api.js models to lib/models/');
            console.log('3. Start a local server and open index.html');
        })
        .catch(err => {
            console.error('   ❌ Failed to download face-api.js:', err.message);
            console.log('\n⚠️  Please download face-api.js manually from:');
            console.log('   https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js');
        });
} else {
    console.log('   ⚠️  face-api.min.js already exists');
    console.log('\n🎉 Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Configure Firebase in firebase/firebase-config.js');
    console.log('2. Download face-api.js models to lib/models/');
    console.log('3. Start a local server and open index.html');
}

function downloadFile(url, filePath) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(filePath);
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close();
                resolve();
            });
        }).on('error', (err) => {
            fs.unlink(filePath, () => {}); // Delete the file on error
            reject(err);
        });
    });
}

// Create a simple HTTP server for development
console.log('\n🌐 To start a local development server:');
console.log('   python -m http.server 8000');
console.log('   or');
console.log('   npx serve .');
console.log('\nThen open: http://localhost:8000');
