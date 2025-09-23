// Authentication management
const auth = {
    // Check if user is logged in
    isLoggedIn: () => {
        return localStorage.getItem('currentUser') !== null;
    },

    // Get current user
    getCurrentUser: () => {
        const user = localStorage.getItem('currentUser');
        return user ? JSON.parse(user) : null;
    },

    // Set current user
    setCurrentUser: (user) => {
        localStorage.setItem('currentUser', JSON.stringify(user));
        auth.notifyAuthStateChange(); 
    },

    // Logout user
    logout: () => {
        const currentUser = auth.getCurrentUser();
        
        localStorage.removeItem('currentUser');
        
        // Clear all session storage data (including view tracking and likes)
        sessionStorage.clear();
        
        auth.notifyAuthStateChange();
        utils.showToast('Logged out successfully', 'info');
        
        // Redirect based on current page
        const currentPath = window.location.pathname;
        if (currentPath.includes('profile.html')) {
            window.location.href = '../index.html';
        } else if (currentPath.includes('pages/')) {
            window.location.href = '../index.html';
        } else {
            window.location.reload(); // Reload home page to update UI
        }
    },

    // Login user
    login: async (username, password) => {
        try {
            const user = await api.user.login({ username, password });
            auth.setCurrentUser(user);
            utils.showToast('Login successful!', 'success');
            
            // Redirect to home page after short delay
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
            
            return user;
        } catch (error) {
            utils.showToast('Login failed. Please check your credentials.', 'danger');
            throw error;
        }
    },

    // Register user
    register: async (userData) => {
        try {
            // Validate email
            if (!utils.isValidEmail(userData.email)) {
                throw new Error('Please enter a valid email address');
            }

            const user = await api.user.register(userData);
            utils.showToast('Registration successful! Please login.', 'success');
            
            // Redirect to login page after short delay
            setTimeout(() => {
                window.location.href = 'login.html';
            }, 1000);
            
            return user;
        } catch (error) {
            utils.showToast('Registration failed. Please try again.', 'danger');
            throw error;
        }
    },

    // Notify other components of auth state change
    notifyAuthStateChange: () => {
        // Dispatch custom event
        const event = new CustomEvent('authStateChanged', {
            detail: { user: auth.getCurrentUser() }
        });
        window.dispatchEvent(event);
        
        // Update navigation immediately
        auth.updateNavigation();
    },



    // Update navigation based on auth status
    updateNavigation: () => {
        const user = auth.getCurrentUser();
        const loginBtn = document.getElementById('loginBtn');
        const registerBtn = document.getElementById('registerBtn');
        const profileBtn = document.getElementById('profileBtn');
        const logoutBtn = document.getElementById('logoutBtn');
        const loginPrompt = document.getElementById('loginPrompt'); // Add this line

        if (user) {
            // User is logged in
            if (loginBtn) loginBtn.classList.add('d-none');
            if (registerBtn) registerBtn.classList.add('d-none');
            if (profileBtn) {
                profileBtn.classList.remove('d-none');
                profileBtn.textContent = user.name || user.username;
            }
            if (logoutBtn) logoutBtn.classList.remove('d-none');
            if (loginPrompt) loginPrompt.classList.add('d-none'); // Add this line
        } else {
            // User is not logged in
            if (loginBtn) loginBtn.classList.remove('d-none');
            if (registerBtn) registerBtn.classList.remove('d-none');
            if (profileBtn) profileBtn.classList.add('d-none');
            if (logoutBtn) logoutBtn.classList.add('d-none');
            if (loginPrompt) loginPrompt.classList.remove('d-none'); // Add this line
        }

        // Update comment form state
        if (typeof comments !== 'undefined') {
            comments.updateAuthorInfo();
        }
    }
};

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', () => {
    auth.updateNavigation();

    // Handle login form
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                await auth.login(username, password);
            } catch (error) {
                console.error('Login error:', error);
            }
        });
    }

    // Handle register form
    const registerForm = document.getElementById('registerForm');
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const userData = {
                username: document.getElementById('username').value,
                name: document.getElementById('name').value,
                email: document.getElementById('email').value,
                contact: document.getElementById('contact').value,
                password: document.getElementById('password').value,
                bio: document.getElementById('bio').value
            };
            
            try {
                await auth.register(userData);
            } catch (error) {
                console.error('Registration error:', error);
            }
        });
    }

    // Handle logout button
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', (e) => {
            e.preventDefault();
            if (confirm('Are you sure you want to logout?')) { // Add confirmation
                auth.logout();
            }
        });
    }

    // Listen for auth state changes
    window.addEventListener('authStateChanged', (e) => {
        console.log('Auth state changed:', e.detail.user);
        
        // Update posts display if on home page
        if (typeof posts !== 'undefined' && document.getElementById('postsContainer')) {
            // Refresh current page to show/hide like buttons
            posts.loadPosts(posts.currentPage);
        }
    });
});