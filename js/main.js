// Main application utilities and common functions

class AppUtils {
    constructor() {
        this.init();
    }

    init() {
        // Initialize common event listeners
        this.setupCommonEventListeners();
        this.setupNotifications();
    }

    setupCommonEventListeners() {
        // Handle navigation active states
        this.updateActiveNavigation();
        
        // Handle responsive menu if needed
        this.setupResponsiveMenu();
    }

    setupNotifications() {
        // Create notification container if it doesn't exist
        if (!document.getElementById('notificationContainer')) {
            const container = document.createElement('div');
            container.id = 'notificationContainer';
            container.className = 'fixed top-4 right-4 z-50 space-y-2';
            document.body.appendChild(container);
        }
    }

    updateActiveNavigation() {
        const currentPage = window.location.pathname.split('/').pop() || 'index.html';
        const navLinks = document.querySelectorAll('nav a');
        
        navLinks.forEach(link => {
            const href = link.getAttribute('href');
            if (href === currentPage || (currentPage === '' && href === 'index.html')) {
                link.classList.add('bg-indigo-100', 'text-indigo-700');
            } else {
                link.classList.remove('bg-indigo-100', 'text-indigo-700');
            }
        });
    }

    setupResponsiveMenu() {
        // Add responsive menu functionality if needed
        const menuButton = document.getElementById('menuButton');
        const mobileMenu = document.getElementById('mobileMenu');
        
        if (menuButton && mobileMenu) {
            menuButton.addEventListener('click', () => {
                mobileMenu.classList.toggle('hidden');
            });
        }
    }

    // Show notification
    showNotification(message, type = 'info', duration = 5000) {
        const container = document.getElementById('notificationContainer');
        if (!container) return;

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="flex items-center">
                <i class="material-icons mr-2">${this.getNotificationIcon(type)}</i>
                <span>${message}</span>
                <button onclick="this.parentElement.parentElement.remove()" class="ml-4 text-white hover:text-gray-200">
                    <i class="material-icons text-sm">close</i>
                </button>
            </div>
        `;

        container.appendChild(notification);

        // Show notification
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);

        // Auto remove notification
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentElement) {
                    notification.remove();
                }
            }, 300);
        }, duration);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check_circle',
            error: 'error',
            warning: 'warning',
            info: 'info'
        };
        return icons[type] || 'info';
    }

    // Format date for display
    formatDate(date) {
        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        }).format(date);
    }

    // Format time for display
    formatTime(date) {
        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }).format(date);
    }

    // Format datetime for display
    formatDateTime(date) {
        return `${this.formatDate(date)} at ${this.formatTime(date)}`;
    }

    // Generate unique ID
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    // Validate email
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // Show loading state
    showLoading(element, text = 'Loading...') {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.disabled = true;
            element.innerHTML = `
                <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    ${text}
                </div>
            `;
        }
    }

    // Hide loading state
    hideLoading(element, originalText) {
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (element) {
            element.disabled = false;
            element.innerHTML = originalText;
        }
    }

    // Show modal
    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            modal.classList.add('flex');
        }
    }

    // Hide modal
    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            modal.classList.remove('flex');
        }
    }

    // Confirm dialog
    async confirm(message, title = 'Confirm') {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl p-6 max-w-md mx-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-4">${title}</h3>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <div class="flex space-x-3">
                        <button id="confirmYes" class="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700">
                            Yes
                        </button>
                        <button id="confirmNo" class="bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400">
                            No
                        </button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('confirmYes').onclick = () => {
                document.body.removeChild(modal);
                resolve(true);
            };

            document.getElementById('confirmNo').onclick = () => {
                document.body.removeChild(modal);
                resolve(false);
            };
        });
    }

    // Copy text to clipboard
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            this.showNotification('Copied to clipboard', 'success');
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            this.showNotification('Failed to copy to clipboard', 'error');
            return false;
        }
    }

    // Download file
    downloadFile(data, filename, type = 'text/plain') {
        const blob = new Blob([data], { type });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    }
}

// Initialize app utilities
window.appUtils = new AppUtils();

// Global utility functions for easy access
window.showNotification = (message, type, duration) => window.appUtils.showNotification(message, type, duration);
window.formatDate = (date) => window.appUtils.formatDate(date);
window.formatTime = (date) => window.appUtils.formatTime(date);
window.formatDateTime = (date) => window.appUtils.formatDateTime(date);
window.showModal = (modalId) => window.appUtils.showModal(modalId);
window.hideModal = (modalId) => window.appUtils.hideModal(modalId);
