// Mobile-specific enhancements for Face Attendance System

class MobileEnhancements {
    constructor() {
        this.isMobile = this.detectMobile();
        this.touchStartY = 0;
        this.touchEndY = 0;
        this.init();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               (window.innerWidth <= 768);
    }

    init() {
        if (this.isMobile) {
            this.setupMobileFeatures();
            this.setupTouchEvents();
            this.setupViewportHandling();
            this.setupMobileNavigation();
        }
    }

    setupMobileFeatures() {
        // Add mobile-specific classes
        document.body.classList.add('mobile-device');
        
        // Prevent zoom on input focus (iOS)
        const inputs = document.querySelectorAll('input, select, textarea');
        inputs.forEach(input => {
            input.addEventListener('focus', () => {
                if (this.isIOS()) {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', 
                        'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
                }
            });
            
            input.addEventListener('blur', () => {
                if (this.isIOS()) {
                    document.querySelector('meta[name="viewport"]').setAttribute('content', 
                        'width=device-width, initial-scale=1.0');
                }
            });
        });

        // Add mobile-specific event listeners
        this.setupMobileWebcam();
        this.setupMobileModals();
    }

    setupTouchEvents() {
        // Handle swipe gestures for navigation
        let startX = 0;
        let startY = 0;
        let endX = 0;
        let endY = 0;

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
        });

        document.addEventListener('touchend', (e) => {
            endX = e.changedTouches[0].clientX;
            endY = e.changedTouches[0].clientY;
            this.handleSwipe(startX, startY, endX, endY);
        });

        // Prevent default touch behaviors that interfere with functionality
        document.addEventListener('touchmove', (e) => {
            // Allow scrolling but prevent some default behaviors
            if (e.target.closest('.webcam-container')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    handleSwipe(startX, startY, endX, endY) {
        const deltaX = endX - startX;
        const deltaY = endY - startY;
        const minSwipeDistance = 50;

        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > minSwipeDistance) {
            if (deltaX > 0) {
                // Swipe right - could navigate back
                this.handleSwipeRight();
            } else {
                // Swipe left - could navigate forward
                this.handleSwipeLeft();
            }
        }
    }

    handleSwipeRight() {
        // Optional: Add back navigation
        if (window.history.length > 1) {
            // window.history.back();
        }
    }

    handleSwipeLeft() {
        // Optional: Add forward navigation
    }

    setupViewportHandling() {
        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.handleOrientationChange();
            }, 100);
        });

        // Handle resize events
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    handleOrientationChange() {
        // Recalculate webcam dimensions
        const webcam = document.getElementById('webcam');
        if (webcam && webcam.videoWidth && webcam.videoHeight) {
            this.resizeWebcamCanvas();
        }

        // Adjust modal positioning
        this.adjustModalPositioning();
    }

    handleResize() {
        // Update mobile detection
        const wasMobile = this.isMobile;
        this.isMobile = this.detectMobile();
        
        if (wasMobile !== this.isMobile) {
            document.body.classList.toggle('mobile-device', this.isMobile);
        }
    }

    setupMobileNavigation() {
        // Add mobile menu toggle if needed
        const nav = document.querySelector('nav');
        if (nav && this.isMobile) {
            this.createMobileMenuToggle(nav);
        }
    }

    createMobileMenuToggle(nav) {
        // Add hamburger menu for very small screens
        if (window.innerWidth < 480) {
            const toggle = document.createElement('button');
            toggle.className = 'mobile-menu-toggle md:hidden p-2 rounded-lg hover:bg-gray-100';
            toggle.innerHTML = '<i class="material-icons">menu</i>';
            
            const navLinks = nav.querySelector('.nav-links');
            if (navLinks) {
                navLinks.classList.add('mobile-menu', 'hidden');
                navLinks.classList.remove('flex');
                
                toggle.addEventListener('click', () => {
                    navLinks.classList.toggle('hidden');
                    navLinks.classList.toggle('flex');
                });
                
                nav.appendChild(toggle);
            }
        }
    }

    setupMobileWebcam() {
        // Optimize webcam for mobile
        const webcam = document.getElementById('webcam');
        if (webcam) {
            // Set mobile-optimized constraints
            const constraints = {
                video: {
                    width: { ideal: this.isMobile ? 320 : 640 },
                    height: { ideal: this.isMobile ? 240 : 480 },
                    facingMode: 'user',
                    frameRate: { ideal: this.isMobile ? 15 : 30 }
                }
            };

            // Update webcam constraints if already active
            if (webcam.srcObject) {
                const stream = webcam.srcObject;
                const track = stream.getVideoTracks()[0];
                if (track) {
                    track.applyConstraints(constraints.video);
                }
            }
        }
    }

    setupMobileModals() {
        // Make modals more mobile-friendly
        const modals = document.querySelectorAll('[id$="Modal"]');
        modals.forEach(modal => {
            modal.addEventListener('touchstart', (e) => {
                this.touchStartY = e.touches[0].clientY;
            });

            modal.addEventListener('touchmove', (e) => {
                this.touchEndY = e.touches[0].clientY;
            });

            modal.addEventListener('touchend', () => {
                // Close modal on swipe down
                if (this.touchStartY - this.touchEndY > 100) {
                    this.closeModal(modal);
                }
            });
        });
    }

    closeModal(modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }

    resizeWebcamCanvas() {
        const webcam = document.getElementById('webcam');
        const canvas = document.getElementById('faceCanvas');
        
        if (webcam && canvas) {
            canvas.width = webcam.videoWidth;
            canvas.height = webcam.videoHeight;
        }
    }

    adjustModalPositioning() {
        const modals = document.querySelectorAll('.modal-content');
        modals.forEach(modal => {
            // Ensure modals are properly positioned on mobile
            modal.style.maxHeight = '90vh';
            modal.style.overflowY = 'auto';
        });
    }

    isIOS() {
        return /iPad|iPhone|iPod/.test(navigator.userAgent);
    }

    // Utility method to show mobile-specific notifications
    showMobileNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 left-4 right-4 z-50 p-4 rounded-lg shadow-lg text-white text-center text-sm ${
            type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' :
            type === 'warning' ? 'bg-yellow-600' : 'bg-blue-600'
        }`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    // Handle mobile-specific camera permissions
    async requestCameraPermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: this.isMobile ? 320 : 640 },
                    height: { ideal: this.isMobile ? 240 : 480 },
                    facingMode: 'user'
                }
            });
            return stream;
        } catch (error) {
            if (error.name === 'NotAllowedError') {
                this.showMobileNotification('Camera permission denied. Please enable camera access in your browser settings.', 'error');
            } else if (error.name === 'NotFoundError') {
                this.showMobileNotification('No camera found. Please connect a camera to use this feature.', 'error');
            } else {
                this.showMobileNotification('Error accessing camera: ' + error.message, 'error');
            }
            throw error;
        }
    }
}

// Initialize mobile enhancements when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.mobileEnhancements = new MobileEnhancements();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileEnhancements;
}
