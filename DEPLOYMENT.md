# Deployment Guide

This guide covers different deployment options for the Face Attendance System.

## Local Development

### Option 1: Using Node.js (Recommended)
```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Option 2: Using Python
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

### Option 3: Using PHP
```bash
php -S localhost:8000
```

## Firebase Hosting (Recommended for Production)

### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
```

### 2. Login to Firebase
```bash
firebase login
```

### 3. Initialize Firebase Hosting
```bash
firebase init hosting
```

### 4. Configure firebase.json
```json
{
  "hosting": {
    "public": ".",
    "ignore": [
      "firebase.json",
      "**/.*",
      "**/node_modules/**",
      "lib/models/**",
      "setup.js",
      "package.json",
      "package-lock.json",
      "README.md",
      "DEPLOYMENT.md"
    ],
    "rewrites": [
      {
        "source": "**",
        "destination": "/index.html"
      }
    ],
    "headers": [
      {
        "source": "**/*.@(js|css)",
        "headers": [
          {
            "key": "Cache-Control",
            "value": "max-age=31536000"
          }
        ]
      }
    ]
  }
}
```

### 5. Deploy
```bash
firebase deploy
```

## Netlify Deployment

### 1. Connect Repository
1. Go to [Netlify](https://netlify.com)
2. Connect your Git repository
3. Set build command: `npm run build` (or leave empty)
4. Set publish directory: `.` (root directory)

### 2. Environment Variables
Add these environment variables in Netlify dashboard:
- `FIREBASE_API_KEY`
- `FIREBASE_AUTH_DOMAIN`
- `FIREBASE_PROJECT_ID`
- `FIREBASE_STORAGE_BUCKET`
- `FIREBASE_MESSAGING_SENDER_ID`
- `FIREBASE_APP_ID`

### 3. Deploy
Netlify will automatically deploy on every push to your main branch.

## Vercel Deployment

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Deploy
```bash
vercel
```

### 3. Configure Environment Variables
Add Firebase configuration as environment variables in Vercel dashboard.

## GitHub Pages

### 1. Enable GitHub Pages
1. Go to repository Settings
2. Scroll to GitHub Pages section
3. Select source branch (usually `main` or `gh-pages`)

### 2. Update Firebase Config
Update `firebase/firebase-config.js` to use environment variables or hardcode production values.

## Apache/Nginx Deployment

### Apache .htaccess
```apache
RewriteEngine On
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule ^(.*)$ /index.html [QSA,L]

# Enable HTTPS
RewriteCond %{HTTPS} off
RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]

# Security headers
Header always set X-Content-Type-Options nosniff
Header always set X-Frame-Options DENY
Header always set X-XSS-Protection "1; mode=block"
```

### Nginx Configuration
```nginx
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name your-domain.com;
    
    root /var/www/face-attendance-system;
    index index.html;
    
    # SSL configuration
    ssl_certificate /path/to/certificate.crt;
    ssl_certificate_key /path/to/private.key;
    
    # Security headers
    add_header X-Content-Type-Options nosniff;
    add_header X-Frame-Options DENY;
    add_header X-XSS-Protection "1; mode=block";
    
    # Handle SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## Docker Deployment

### 1. Create Dockerfile
```dockerfile
FROM nginx:alpine

# Copy project files
COPY . /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 2. Create nginx.conf
```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;
    
    server {
        listen 80;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;
        
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

### 3. Build and Run
```bash
docker build -t face-attendance-system .
docker run -p 80:80 face-attendance-system
```

## Environment Configuration

### Development
```javascript
// firebase/firebase-config.js
const firebaseConfig = {
    apiKey: "dev-api-key",
    authDomain: "dev-project.firebaseapp.com",
    projectId: "dev-project-id",
    storageBucket: "dev-project.appspot.com",
    messagingSenderId: "123456789",
    appId: "dev-app-id"
};
```

### Production
```javascript
// Use environment variables or separate config file
const firebaseConfig = {
    apiKey: process.env.FIREBASE_API_KEY || "prod-api-key",
    authDomain: process.env.FIREBASE_AUTH_DOMAIN || "prod-project.firebaseapp.com",
    projectId: process.env.FIREBASE_PROJECT_ID || "prod-project-id",
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET || "prod-project.appspot.com",
    messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID || "987654321",
    appId: process.env.FIREBASE_APP_ID || "prod-app-id"
};
```

## Security Considerations

### 1. HTTPS Required
- Face recognition requires HTTPS for camera access
- Configure SSL certificates for production
- Use Let's Encrypt for free SSL certificates

### 2. Firebase Security Rules
- Implement proper Firestore security rules
- Restrict storage access to authenticated users
- Use Firebase App Check for additional security

### 3. Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://www.gstatic.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               font-src 'self' https://fonts.gstatic.com; 
               img-src 'self' data: blob:; 
               connect-src 'self' https://*.firebaseio.com https://*.googleapis.com;">
```

## Performance Optimization

### 1. Enable Compression
```nginx
# Nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;
```

### 2. Cache Static Assets
```nginx
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 3. Use CDN
- Serve static assets from CDN
- Use Firebase Hosting for optimal performance
- Consider CloudFlare for additional caching

## Monitoring and Analytics

### 1. Firebase Analytics
```javascript
// Add to your HTML
<script src="https://www.gstatic.com/firebasejs/9.22.0/firebase-analytics.js"></script>
```

### 2. Error Tracking
```javascript
// Add error tracking
window.addEventListener('error', (event) => {
    console.error('Global error:', event.error);
    // Send to your error tracking service
});
```

## Backup and Recovery

### 1. Firebase Data Export
```bash
# Export Firestore data
gcloud firestore export gs://your-backup-bucket/backup-$(date +%Y%m%d)
```

### 2. Code Backup
- Use Git for version control
- Regular commits and pushes
- Tag releases for easy rollback

## Troubleshooting

### Common Issues

1. **Camera Access Denied**
   - Ensure HTTPS is enabled
   - Check browser permissions
   - Verify SSL certificate

2. **Face Detection Not Working**
   - Check face-api.js models are loaded
   - Verify browser compatibility
   - Check console for errors

3. **Firebase Connection Issues**
   - Verify Firebase configuration
   - Check network connectivity
   - Review security rules

4. **Performance Issues**
   - Enable compression
   - Optimize images
   - Use CDN for static assets
