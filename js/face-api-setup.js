// Face API setup and utilities

class FaceAPIManager {
    constructor() {
        this.isLoaded = false;
        this.isLoading = false;
        this.modelsPath = './lib/models/';
        this.faceDetectionOptions = new faceapi.SsdMobilenetv1Options({ minConfidence: 0.5 });
    }

    // Initialize face-api.js models
    async loadModels() {
        if (this.isLoaded) return true;
        if (this.isLoading) return false;

        this.isLoading = true;
        console.log('Loading face-api.js models...');

        try {
            // Load models with error handling
            await faceapi.nets.ssdMobilenetv1.loadFromUri(this.modelsPath);
            await faceapi.nets.faceLandmark68Net.loadFromUri(this.modelsPath);
            await faceapi.nets.faceRecognitionNet.loadFromUri(this.modelsPath);
            await faceapi.nets.faceExpressionNet.loadFromUri(this.modelsPath);

            this.isLoaded = true;
            this.isLoading = false;
            console.log('Face-api.js models loaded successfully');
            return true;
        } catch (error) {
            console.error('Error loading face-api.js models:', error);
            
            // Try to load from CDN as fallback
            try {
                console.log('Attempting to load models from CDN...');
                const cdnPath = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/weights/';
                await faceapi.nets.ssdMobilenetv1.loadFromUri(cdnPath);
                await faceapi.nets.faceLandmark68Net.loadFromUri(cdnPath);
                await faceapi.nets.faceRecognitionNet.loadFromUri(cdnPath);
                await faceapi.nets.faceExpressionNet.loadFromUri(cdnPath);
                
                this.modelsPath = cdnPath;
                this.isLoaded = true;
                this.isLoading = false;
                console.log('Face-api.js models loaded successfully from CDN');
                return true;
            } catch (cdnError) {
                console.error('Error loading face-api.js models from CDN:', cdnError);
                this.isLoading = false;
                return false;
            }
        }
    }

    // Detect faces in an image/video element
    async detectFaces(imageElement) {
        if (!this.isLoaded) {
            console.warn('Face API models not loaded yet');
            return [];
        }

        try {
            const detections = await faceapi
                .detectAllFaces(imageElement, this.faceDetectionOptions)
                .withFaceLandmarks()
                .withFaceDescriptors();

            return detections;
        } catch (error) {
            // Don't log continuously as this is expected when no face is detected
            // console.error('Error detecting faces:', error);
            return [];
        }
    }

    // Extract face descriptor for recognition
    async extractFaceDescriptor(imageElement) {
        const detections = await this.detectFaces(imageElement);
        
        if (detections.length === 0) {
            throw new Error('No face detected in the image. Please ensure your face is clearly visible in the camera.');
        }

        if (detections.length > 1) {
            throw new Error('Multiple faces detected. Please ensure only one face is visible.');
        }

        return detections[0].descriptor;
    }

    // Compare two face descriptors
    compareFaces(descriptor1, descriptor2, threshold = 0.6) {
        if (!descriptor1 || !descriptor2) {
            return { distance: 1, isMatch: false, confidence: 0 };
        }
        
        try {
            const distance = faceapi.euclideanDistance(descriptor1, descriptor2);
            return {
                distance: distance,
                isMatch: distance < threshold,
                confidence: Math.max(0, 1 - distance)
            };
        } catch (error) {
            console.error('Error comparing faces:', error);
            return { distance: 1, isMatch: false, confidence: 0 };
        }
    }

    // Draw face detection boxes on canvas
    drawFaceBoxes(canvas, detections, options = {}) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        detections.forEach(detection => {
            const { x, y, width, height } = detection.detection.box;

            // Draw bounding box
            ctx.strokeStyle = options.color || '#10b981';
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, width, height);

            // Draw confidence score
            if (options.showConfidence !== false) {
                ctx.fillStyle = options.color || '#10b981';
                ctx.font = '12px Arial';
                ctx.fillText(
                    `${Math.round(detection.detection.score * 100)}%`,
                    x, y - 5
                );
            }
        });
    }

    // Get face detection status
    getStatus() {
        return {
            isLoaded: this.isLoaded,
            isLoading: this.isLoading,
            modelsPath: this.modelsPath
        };
    }

    // Reset face detection
    reset() {
        this.isLoaded = false;
        this.isLoading = false;
    }
}

// Initialize face API manager
window.faceAPIManager = new FaceAPIManager();

// Utility function to show face detection status
function updateFaceAPIStatus() {
    const status = window.faceAPIManager.getStatus();
    const statusElement = document.getElementById('faceApiStatusText');
    const indicatorElement = document.getElementById('faceApiStatus');
    
    if (statusElement && indicatorElement) {
        if (status.isLoading) {
            statusElement.textContent = 'Loading...';
            indicatorElement.className = 'w-3 h-3 bg-yellow-500 rounded-full mr-2';
        } else if (status.isLoaded) {
            statusElement.textContent = 'Ready';
            indicatorElement.className = 'w-3 h-3 bg-green-500 rounded-full mr-2';
        } else {
            statusElement.textContent = 'Not Loaded';
            indicatorElement.className = 'w-3 h-3 bg-red-500 rounded-full mr-2';
        }
    }
}

// Auto-update status every second
setInterval(updateFaceAPIStatus, 1000);