// Registration page functionality

class RegistrationManager {
    constructor() {
        this.webcam = null;
        this.stream = null;
        this.faceDescriptor = null;
        this.isCaptured = false;
        this.init();
    }

    async init() {
        // Load face-api.js models
        await this.loadFaceAPI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize webcam
        await this.initializeWebcam();
    }

    async loadFaceAPI() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }

        try {
            const loaded = await window.faceAPIManager.loadModels();
            if (loaded) {
                this.updateModelStatus('Ready', 'green');
            } else {
                this.updateModelStatus('Failed to load', 'red');
                showNotification('Failed to load face detection models', 'error');
            }
        } catch (error) {
            console.error('Error loading face API:', error);
            this.updateModelStatus('Error', 'red');
            showNotification('Error loading face detection models', 'error');
        } finally {
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
                };
            }
        } catch (error) {
            console.error('Error accessing webcam:', error);
            this.updateCameraStatus('Error', 'red');
            showNotification('Unable to access webcam. Please check permissions.', 'error');
        }
    }

    startFaceDetection() {
        if (!this.webcam) return;

        const detectFaces = async () => {
            if (this.webcam && this.webcam.readyState === 4) {
                try {
                    const detections = await window.faceAPIManager.detectFaces(this.webcam);
                    this.updateFaceDetectionStatus(detections.length > 0);
                    this.drawFaceBoxes(detections);
                } catch (error) {
                    console.error('Face detection error:', error);
                }
            }
            requestAnimationFrame(detectFaces);
        };

        detectFaces();
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
        const indicatorElement = document.getElementById('cameraStatus');

        if (statusElement) statusElement.textContent = status;
        if (indicatorElement) {
            indicatorElement.className = `w-3 h-3 bg-${color}-500 rounded-full mr-2`;
        }
    }

    async captureFace() {
        if (!this.webcam || this.isCaptured) return;

        try {
            showNotification('Capturing face...', 'info');
            
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
            showNotification('Face captured successfully!', 'success');

        } catch (error) {
            console.error('Error capturing face:', error);
            this.updateCaptureStatus(error.message, 'error');
            showNotification(error.message, 'error');
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

    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (!this.isCaptured) {
            showNotification('Please capture your face first', 'warning');
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
        appUtils.showLoading(registerBtn, 'Registering...');

        try {
            // Import Firebase functions
            const { collection, addDoc, updateDoc } = await import('firebase/firestore');
            const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');
            
            // Save user data to Firestore
            const userRef = await addDoc(collection(db, 'users'), userData);
            
            // Upload face image to Firebase Storage
            const faceImageBlob = this.dataURLToBlob(this.faceImage);
            const storageRef = ref(storage, `face_images/${userRef.id}.jpg`);
            await uploadBytes(storageRef, faceImageBlob);
            
            // Update user document with image URL
            const imageUrl = await getDownloadURL(storageRef);
            await updateDoc(userRef, { faceImageUrl: imageUrl });

            showNotification('User registered successfully!', 'success');
            this.showSuccessModal();
            this.resetForm();

        } catch (error) {
            console.error('Registration error:', error);
            showNotification('Registration failed: ' + error.message, 'error');
        } finally {
            appUtils.hideLoading(registerBtn, originalText);
        }
    }

    validateFormData(data) {
        if (!data.name || data.name.trim().length < 2) {
            showNotification('Please enter a valid name', 'error');
            return false;
        }

        if (!data.email || !appUtils.isValidEmail(data.email)) {
            showNotification('Please enter a valid email address', 'error');
            return false;
        }

        if (!data.role) {
            showNotification('Please select a role', 'error');
            return false;
        }

        return true;
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
    }

    // Cleanup when page unloads
    cleanup() {
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
