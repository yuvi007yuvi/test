// Attendance page functionality

class AttendanceManager {
    constructor() {
        this.webcam = null;
        this.stream = null;
        this.isDetecting = false;
        this.detectionInterval = null;
        this.registeredUsers = new Map();
        this.attendanceLog = [];
        this.todayAttendance = new Set();
        this.init();
    }

    async init() {
        // Load face-api.js models
        await this.loadFaceAPI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize webcam
        await this.initializeWebcam();
        
        // Load registered users
        await this.loadRegisteredUsers();
        
        // Load today's attendance
        await this.loadTodayAttendance();
    }

    async loadFaceAPI() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('hidden');
        }

        try {
            const loaded = await window.faceAPIManager.loadModels();
            if (loaded) {
                this.updateFaceAPIStatus('Ready', 'green');
            } else {
                this.updateFaceAPIStatus('Failed to load', 'red');
                showNotification('Failed to load face detection models', 'error');
            }
        } catch (error) {
            console.error('Error loading face API:', error);
            this.updateFaceAPIStatus('Error', 'red');
            showNotification('Error loading face detection models', 'error');
        } finally {
            if (loadingOverlay) {
                loadingOverlay.classList.add('hidden');
            }
        }
    }

    setupEventListeners() {
        // Start/Stop detection buttons
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');

        if (startBtn) {
            startBtn.addEventListener('click', () => this.startDetection());
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => this.stopDetection());
        }
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

    async loadRegisteredUsers() {
        try {
            const { collection, getDocs } = await import('firebase/firestore');
            const usersSnapshot = await getDocs(collection(db, 'users'));
            this.registeredUsers.clear();
            
            usersSnapshot.forEach(doc => {
                const userData = doc.data();
                if (userData.faceDescriptor && userData.isActive) {
                    this.registeredUsers.set(doc.id, {
                        id: doc.id,
                        name: userData.name,
                        email: userData.email,
                        role: userData.role,
                        faceDescriptor: new Float32Array(userData.faceDescriptor)
                    });
                }
            });
            
            console.log(`Loaded ${this.registeredUsers.size} registered users`);
        } catch (error) {
            console.error('Error loading registered users:', error);
            showNotification('Failed to load registered users', 'error');
        }
    }

    async loadTodayAttendance() {
        try {
            const { collection, getDocs, query, where, orderBy, Timestamp } = await import('firebase/firestore');
            const today = new Date();
            const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

            const attendanceQuery = query(
                collection(db, 'attendance'),
                where('timestamp', '>=', Timestamp.fromDate(startOfDay)),
                where('timestamp', '<', Timestamp.fromDate(endOfDay)),
                orderBy('timestamp', 'desc')
            );

            const attendanceSnapshot = await getDocs(attendanceQuery);

            this.todayAttendance.clear();
            this.attendanceLog = [];

            attendanceSnapshot.forEach(doc => {
                const attendanceData = doc.data();
                this.todayAttendance.add(attendanceData.userId);
                this.attendanceLog.push({
                    id: doc.id,
                    ...attendanceData
                });
            });

            this.updateAttendanceDisplay();
        } catch (error) {
            console.error('Error loading today\'s attendance:', error);
        }
    }

    startDetection() {
        if (this.isDetecting) return;

        this.isDetecting = true;
        this.updateDetectionStatus('Active', 'green');
        
        // Update button states
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;

        // Start face detection loop
        this.detectionInterval = setInterval(() => {
            this.detectAndMatchFaces();
        }, 1000); // Check every second

        showNotification('Face detection started', 'success');
    }

    stopDetection() {
        if (!this.isDetecting) return;

        this.isDetecting = false;
        this.updateDetectionStatus('Inactive', 'red');
        
        // Update button states
        const startBtn = document.getElementById('startBtn');
        const stopBtn = document.getElementById('stopBtn');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;

        // Stop detection loop
        if (this.detectionInterval) {
            clearInterval(this.detectionInterval);
            this.detectionInterval = null;
        }

        showNotification('Face detection stopped', 'info');
    }

    async detectAndMatchFaces() {
        if (!this.webcam || !this.isDetecting) return;

        try {
            const detections = await window.faceAPIManager.detectFaces(this.webcam);
            this.drawFaceBoxes(detections);

            if (detections.length > 0) {
                for (const detection of detections) {
                    await this.matchFace(detection);
                }
            }
        } catch (error) {
            console.error('Face detection error:', error);
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
    }

    async matchFace(detection) {
        const faceDescriptor = detection.descriptor;
        let bestMatch = null;
        let bestDistance = Infinity;

        // Compare with all registered users
        for (const [userId, userData] of this.registeredUsers) {
            const comparison = window.faceAPIManager.compareFaces(faceDescriptor, userData.faceDescriptor);
            
            if (comparison.isMatch && comparison.distance < bestDistance) {
                bestMatch = userData;
                bestDistance = comparison.distance;
            }
        }

        // If we found a match and user hasn't already marked attendance today
        if (bestMatch && !this.todayAttendance.has(bestMatch.id)) {
            await this.markAttendance(bestMatch);
        }
    }

    async markAttendance(user) {
        try {
            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const attendanceData = {
                userId: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                timestamp: serverTimestamp(),
                status: 'present',
                confidence: 1 - bestDistance // Convert distance to confidence
            };

            // Save to Firestore
            const docRef = await addDoc(collection(db, 'attendance'), attendanceData);
            
            // Update local data
            this.todayAttendance.add(user.id);
            this.attendanceLog.unshift({
                id: docRef.id,
                ...attendanceData,
                timestamp: new Date()
            });

            // Update display
            this.updateAttendanceDisplay();
            this.showAttendanceSuccess(user.name);
            
            console.log(`Attendance marked for ${user.name}`);

        } catch (error) {
            console.error('Error marking attendance:', error);
            showNotification('Failed to mark attendance', 'error');
        }
    }

    updateAttendanceDisplay() {
        // Update stats
        const totalMarked = document.getElementById('totalMarked');
        const lastAttendance = document.getElementById('lastAttendance');
        const attendanceList = document.getElementById('attendanceList');

        if (totalMarked) {
            totalMarked.textContent = this.todayAttendance.size;
        }

        if (lastAttendance && this.attendanceLog.length > 0) {
            const lastTime = this.attendanceLog[0].timestamp;
            lastAttendance.textContent = formatTime(lastTime);
        }

        // Update attendance list
        if (attendanceList) {
            if (this.attendanceLog.length === 0) {
                attendanceList.innerHTML = '<div class="p-4 text-center text-gray-500">No attendance marked yet</div>';
            } else {
                attendanceList.innerHTML = this.attendanceLog.slice(0, 10).map(record => `
                    <div class="attendance-item">
                        <div class="attendance-avatar">
                            ${record.name.charAt(0).toUpperCase()}
                        </div>
                        <div class="attendance-info">
                            <div class="attendance-name">${record.name}</div>
                            <div class="attendance-time">${formatTime(record.timestamp)}</div>
                        </div>
                        <div class="attendance-status">
                            <span class="status-badge present">Present</span>
                        </div>
                    </div>
                `).join('');
            }
        }
    }

    showAttendanceSuccess(userName) {
        const modal = document.getElementById('attendanceModal');
        const message = document.getElementById('attendanceMessage');
        
        if (message) {
            message.textContent = `Attendance Marked ✅ ${userName}`;
        }
        
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }

        // Auto close after 3 seconds
        setTimeout(() => {
            this.closeAttendanceModal();
        }, 3000);
    }

    closeAttendanceModal() {
        const modal = document.getElementById('attendanceModal');
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    updateFaceAPIStatus(status, color) {
        const statusElement = document.getElementById('faceApiStatusText');
        const indicatorElement = document.getElementById('faceApiStatus');

        if (statusElement) statusElement.textContent = status;
        if (indicatorElement) {
            indicatorElement.className = `w-3 h-3 bg-${color}-500 rounded-full mr-2`;
        }
    }

    updateCameraStatus(status, color) {
        const statusElement = document.getElementById('cameraStatusText');
        const indicatorElement = document.getElementById('cameraStatus');

        if (statusElement) statusElement.textContent = status;
        if (indicatorElement) {
            indicatorElement.className = `w-3 h-3 bg-${color}-500 rounded-full mr-2`;
        }
    }

    updateDetectionStatus(status, color) {
        const statusElement = document.getElementById('detectionStatusText');
        const indicatorElement = document.getElementById('detectionStatus');

        if (statusElement) statusElement.textContent = status;
        if (indicatorElement) {
            indicatorElement.className = `w-3 h-3 bg-${color}-500 rounded-full mr-2`;
        }
    }

    // Cleanup when page unloads
    cleanup() {
        this.stopDetection();
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
    }
}

// Initialize attendance manager when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.attendanceManager = new AttendanceManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.attendanceManager) {
        window.attendanceManager.cleanup();
    }
});

// Global function for closing attendance modal
function closeAttendanceModal() {
    if (window.attendanceManager) {
        window.attendanceManager.closeAttendanceModal();
    }
}
