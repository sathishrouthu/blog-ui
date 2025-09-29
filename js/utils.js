// Global configuration
const BASE_URL = 'https://blog-app-0qhy.onrender.com';

// Utility functions
const utils = {
    // Format date to readable format
    formatDate: (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    },

    // Show toast notification
    showToast: (message, type = 'info') => {
        const toastContainer = document.getElementById('toastContainer') || utils.createToastContainer();
        const toast = document.createElement('div');
        toast.className = `toast align-items-center text-white bg-${type} border-0`;
        toast.setAttribute('role', 'alert');
        toast.innerHTML = `
            <div class="d-flex">
                <div class="toast-body">${message}</div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
            </div>
        `;
        toastContainer.appendChild(toast);
        const bsToast = new bootstrap.Toast(toast);
        bsToast.show();
        
        // Remove toast after it's hidden
        toast.addEventListener('hidden.bs.toast', () => {
            toast.remove();
        });
    },

    // Create toast container if it doesn't exist
    createToastContainer: () => {
        const container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1055';
        document.body.appendChild(container);
        return container;
    },

    // Get URL parameters
    getUrlParams: () => {
        const params = new URLSearchParams(window.location.search);
        return Object.fromEntries(params.entries());
    },

    // Truncate text
    truncateText: (text, maxLength = 150) => {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    },

    // Show/hide loading spinner
    showLoading: (container) => {
        container.innerHTML = `
            <div class="text-center">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
            </div>
        `;
    },

    // Validate email format
    isValidEmail: (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    },

    // Clear view tracking data (useful for testing)
    clearViewData: () => {
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('viewed_post_')) {
                sessionStorage.removeItem(key);
            }
        });
    },

    // Clear like data for specific user
    clearUserLikeData: (userId) => {
        Object.keys(sessionStorage).forEach(key => {
            if (key.includes(`_user_${userId}`) && key.includes('liked_post_')) {
                sessionStorage.removeItem(key);
            }
        });
    },

    // Clear all like data
    clearAllLikeData: () => {
        Object.keys(sessionStorage).forEach(key => {
            if (key.startsWith('liked_post_')) {
                sessionStorage.removeItem(key);
            }
        });
    },

    // Check if post is liked by user
    isPostLiked: (postId, userId) => {
        const likeStatusKey = `liked_post_${postId}_user_${userId}`;
        return sessionStorage.getItem(likeStatusKey) === 'true';
    },

    // Set post like status
    setPostLikeStatus: (postId, userId, isLiked) => {
        const likeStatusKey = `liked_post_${postId}_user_${userId}`;
        sessionStorage.setItem(likeStatusKey, isLiked.toString());
    }

    
};
