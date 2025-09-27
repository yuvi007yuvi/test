// Registration page functionality

class RegistrationManager {
    constructor() {
        this.webcam = null;
        this.stream = null;
        this.faceDescriptor = null;
        this.isCaptured = false;
        this.detectionInterval = null;
        this.detectionCount = 0;
        this.init();
    }

    async init() {
        // Show instructions
        this.showWebcamInstructions();
        
        // Load face-api.js models
        await this.loadFaceAPI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize webcam
        await this.initializeWebcam();
    }

    showWebcamInstructions() {
        // Show instructions if we're not on localhost or HTTPS
        if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
            const instructions = document.getElementById('webcamInstructions');
            if (instructions) {
                instructions.classList.remove('hidden');
            }
        }
    }

    async loadFaceAPI() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const faceInstructions = document.getElementById('faceInstructions');
        const facePositionOverlay = document.getElementById('facePositionOverlay');
        
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }
        
        // Hide face positioning overlay during loading
        if (facePositionOverlay) {
            facePositionOverlay.classList.add('hidden');
        }

        try {
            const loaded = await window.faceAPIManager.loadModels();
            if (loaded) {
                this.updateModelStatus('Ready', 'green');
                // Hide loading and show instructions
                if (loadingOverlay) {
                    loadingOverlay.classList.add('hidden');
                }
                // Show face positioning overlay
                if (facePositionOverlay) {
                    facePositionOverlay.classList.remove('hidden');
                }
                this.showNotification('Face detection models loaded successfully', 'success');
            } else {
                this.updateModelStatus('Failed to load', 'red');
                this.showNotification('Failed to load face detection models', 'error');
                if (loadingOverlay) {
                    loadingOverlay.classList.add('hidden');
                }
            }
        } catch (error) {
            console.error('Error loading face API:', error);
            this.updateModelStatus('Error', 'red');
            this.showNotification('Error loading face detection models: ' + error.message, 'error');
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    setupEventListeners() {
        // Form submission
        const form = document.getElementById('registrationForm');
        if (form) {
            form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Capture button
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.captureFace());
        }

        // Start face detection when webcam is ready
        this.startFaceDetection();
    }

    async initializeWebcam() {
        // Check if mediaDevices is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            console.error('WebRTC is not supported in this browser');
            this.updateCameraStatus('Not supported', 'red');
            this.showNotification('Webcam is not supported in this browser. Try Chrome, Firefox, or Edge.', 'error');
            return;
        }

        try {
            this.stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user'
                }
            });

            this.webcam = document.getElementById('webcam');
            if (this.webcam) {
                this.webcam.srcObject = this.stream;
                this.webcam.onloadedmetadata = () => {
                    this.webcam.play();
                    this.updateCameraStatus('Active', 'green');
                    // Hide instructions once camera is active
                    const faceInstructions = document.getElementById('faceInstructions');
                    if (faceInstructions) {
                        faceInstructions.classList.add('hidden');
                    }
                    this.showNotification('Camera activated successfully', 'success');
                };
            }
        } catch (error) {
            console.error('Error accessing webcam:', error);
            this.updateCameraStatus('Error', 'red');
            
            // Show specific error message based on error type
            if (error.name === 'NotAllowedError') {
                this.showNotification('Camera access denied. Please allow camera access when prompted.', 'error');
            } else if (error.name === 'NotFoundError') {
                this.showNotification('No camera found. Please connect a camera to use this feature.', 'error');
            } else {
                this.showNotification('Unable to access webcam. Please check permissions and try again. Error: ' + error.message, 'error');
            }
        }
    }

    startFaceDetection() {
        if (!this.webcam) return;

        // Clear any existing interval
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }

        // Run face detection every 100ms
        this.detectionInterval = setInterval(() => {
            if (this.webcam && this.webcam.readyState === 4) {
                this.detectFaces();
            }
        }, 100);
    }

    async detectFaces() {
        try {
            const detections = await window.faceAPIManager.detectFaces(this.webcam);
            
            // Debug information
            this.detectionCount++;
            if (this.detectionCount % 50 === 0) { // Log every 5 seconds
                console.log('Face detection attempt:', this.detectionCount, 'Detections found:', detections.length);
            }
            
            this.updateFaceDetectionStatus(detections.length > 0);
            this.drawFaceBoxes(detections);
            
            // Hide face positioning overlay when face is detected
            const facePositionOverlay = document.getElementById('facePositionOverlay');
            if (detections.length > 0 && facePositionOverlay) {
                facePositionOverlay.classList.add('hidden');
            } else if (detections.length === 0 && facePositionOverlay) {
                facePositionOverlay.classList.remove('hidden');
            }
        } catch (error) {
            // Log error only occasionally to avoid console spam
            if (this.detectionCount % 100 === 0) {
                console.error('Face detection error:', error);
            }
        }
    }

    drawFaceBoxes(detections) {
        const canvas = document.getElementById('faceCanvas');
        if (!canvas || !this.webcam) return;

        // Set canvas size to match video
        canvas.width = this.webcam.videoWidth;
        canvas.height = this.webcam.videoHeight;

        // Draw face detection boxes
        window.faceAPIManager.drawFaceBoxes(canvas, detections, {
            color: '#10b981',
            showConfidence: true,
            showExpressions: false
        });
        
        // Debug: Log detection details occasionally
        if (this.detectionCount % 50 === 0 && detections.length > 0) {
            console.log('Face detected:', detections[0].detection);
        }
    }

    updateFaceDetectionStatus(faceDetected) {
        const statusElement = document.getElementById('faceStatus');
        const indicatorElement = document.getElementById('faceDetected');
        const captureBtn = document.getElementById('captureBtn');

        if (faceDetected) {
            if (statusElement) statusElement.textContent = 'Detected';
            if (indicatorElement) {
                indicatorElement.className = 'w-3 h-3 bg-green-500 rounded-full mr-2';
            }
            if (captureBtn) captureBtn.disabled = false;
        } else {
            if (statusElement) statusElement.textContent = 'Not Detected';
            if (indicatorElement) {
                indicatorElement.className = 'w-3 h-3 bg-red-500 rounded-full mr-2';
            }
            if (captureBtn) captureBtn.disabled = true;
        }
    }

    updateModelStatus(status, color) {
        const statusElement = document.getElementById('modelStatus');
        const indicatorElement = document.getElementById('modelLoaded');

        if (statusElement) statusElement.textContent = status;
        if (indicatorElement) {
            indicatorElement.className = `w-3 h-3 bg-${color}-500 rounded-full mr-2`;
        }
    }

    updateCameraStatus(status, color) {
        const statusElement = document.getElementById('cameraStatus');
        const indicatorElement = document.getElementById('cameraStatusIndicator');

        if (statusElement) statusElement.textContent = status;
        if (indicatorElement) {
            indicatorElement.className = `w-3 h-3 bg-${color}-500 rounded-full mr-2`;
        }
    }

    async captureFace() {
        if (!this.webcam || this.isCaptured) return;

        try {
            this.showNotification('Capturing face...', 'info');
            
            // Extract face descriptor
            this.faceDescriptor = await window.faceAPIManager.extractFaceDescriptor(this.webcam);
            
            // Capture face image
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = this.webcam.videoWidth;
            canvas.height = this.webcam.videoHeight;
            ctx.drawImage(this.webcam, 0, 0);
            
            this.faceImage = canvas.toDataURL('image/jpeg', 0.8);
            this.isCaptured = true;

            // Update UI
            this.updateCaptureStatus('Face captured successfully!', 'success');
            this.showNotification('Face captured successfully!', 'success');

        } catch (error) {
            console.error('Error capturing face:', error);
            this.updateCaptureStatus('Face capture failed: ' + error.message, 'error');
            this.showNotification('Face capture failed: ' + error.message, 'error');
        }
    }

    updateCaptureStatus(message, type) {
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.className = `mt-4 p-3 rounded-lg ${type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`;
            statusElement.textContent = message;
            statusElement.classList.remove('hidden');
        }
    }

    showNotification(message, type = 'info') {
        // Use the global showNotification function if available, otherwise show in status
        if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            this.updateCaptureStatus(message, type);
        }
    }

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.isCaptured) {
            this.showNotification('Please capture your face first', 'warning');
            return;
        }

        const formData = new FormData(e.target);
        const userData = {
            name: formData.get('name'),
            email: formData.get('email'),
            role: formData.get('role'),
            faceDescriptor: Array.from(this.faceDescriptor),
            createdAt: new Date(),
            isActive: true
        };

        // Validate form data
        if (!this.validateFormData(userData)) {
            return;
        }

        // Show loading state
        const registerBtn = document.getElementById('registerBtn');
        const originalText = registerBtn.innerHTML;
        if (window.appUtils && typeof window.appUtils.showLoading === 'function') {
            window.appUtils.showLoading(registerBtn, 'Registering...');
        } else {
            registerBtn.disabled = true;
            registerBtn.innerHTML = '<div class="flex items-center justify-center"><div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>Registering...</div>';
        }

        try {
            // Use the globally available Firebase services instead of dynamic imports
            // These are exported from firebase-config.js
            if (!window.db || !window.storage) {
                throw new Error('Firebase services not initialized');
            }

            // Save user data to Firestore using the global db instance
            const userRef = await window.db.collection('users').add(userData);
            
            // Upload face image to Firebase Storage using the global storage instance
            if (this.faceImage) {
                const faceImageBlob = this.dataURLToBlob(this.faceImage);
                
                // Create a reference to the file location in Storage
                const storageRef = window.storage.ref();
                const faceImageRef = storageRef.child(`face_images/${userRef.id}.jpg`);
                
                // Upload the file
                await faceImageRef.put(faceImageBlob);
                
                // Get the download URL
                const imageUrl = await faceImageRef.getDownloadURL();
                
                // Update user document with image URL
                await userRef.update({ faceImageUrl: imageUrl });
            }

            this.showNotification('User registered successfully!', 'success');
            this.showSuccessModal();
            this.resetForm();

        } catch (error) {
            console.error('Registration error:', error);
            this.showNotification('Registration failed: ' + error.message, 'error');
        } finally {
            if (window.appUtils && typeof window.appUtils.hideLoading === 'function') {
                window.appUtils.hideLoading(registerBtn, originalText);
            } else {
                registerBtn.disabled = false;
                registerBtn.innerHTML = originalText;
            }
        }
    }

    validateFormData(data) {
        if (!data.name || data.name.trim().length < 2) {
            this.showNotification('Please enter a valid name', 'error');
            return false;
        }

        if (!data.email || !this.isValidEmail(data.email)) {
            this.showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (!data.role) {
            this.showNotification('Please select a role', 'error');
            return false;
        }

        return true;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    dataURLToBlob(dataURL) {
        const arr = dataURL.split(',');
        const mime = arr[0].match(/:(.*?);/)[1];
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new Blob([u8arr], { type: mime });
    }

    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    resetForm() {
        const form = document.getElementById('registrationForm');
        if (form) {
            form.reset();
        }
        
        this.isCaptured = false;
        this.faceDescriptor = null;
        this.faceImage = null;
        
        const statusElement = document.getElementById('statusMessage');
        if (statusElement) {
            statusElement.classList.add('hidden');
        }
        
        // Re-enable capture button
        const captureBtn = document.getElementById('captureBtn');
        if (captureBtn) {
            captureBtn.disabled = true;
        }
        
        // Show face positioning overlay again
        const facePositionOverlay = document.getElementById('facePositionOverlay');
        if (facePositionOverlay) {
            facePositionOverlay.classList.remove('hidden');
        }
    }

    // Cleanup when page unloads
    cleanup() {
        // Clear detection interval
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
        }
        
        // Stop webcam stream
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Initialize registration manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.registrationManager = new RegistrationManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.registrationManager) {
        window.registrationManager.cleanup();
    }
});

// Global function for closing success modal
function closeSuccessModal() {
    const modal = document.getElementById('successModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}