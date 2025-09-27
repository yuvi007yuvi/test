const https = require('https');
const fs = require('fs');
const path = require('path');
const express = require('express');

// Create Express app
const app = express();

// Serve static files
app.use(express.static('.'));

// Start server
const port = 8443;

// Check if we have SSL certificates, if not, generate self-signed ones
let options = {};
try {
    options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem')
    };
} catch (err) {
    console.log('SSL certificates not found, generating self-signed certificates...');
    
    // Generate self-signed certificates
    const spawn = require('child_process').spawn;
    const openssl = spawn('openssl', ['req', '-newkey', 'rsa:2048', '-new', '-nodes', '-x509', '-days', '3650', '-keyout', 'key.pem', '-out', 'cert.pem', '-subj', '/C=US/ST=State/L=City/O=Organization/CN=localhost']);
    
    openssl.on('close', (code) => {
        if (code === 0) {
            console.log('Self-signed certificates generated successfully');
            options = {
                key: fs.readFileSync('key.pem'),
                cert: fs.readFileSync('cert.pem')
            };
            startServer();
        } else {
            console.error('Failed to generate self-signed certificates');
            console.log('Please install OpenSSL or use a different method to serve over HTTPS');
        }
    });
    
    return;
}

function startServer() {
    https.createServer(options, app).listen(port, () => {
        console.log(`HTTPS Server running on https://localhost:${port}`);
        console.log(`Access the application at https://localhost:${port}/registration.html`);
    });
}

startServer();