// Main application initialization and global event handlers
const app = {
    // Initialize the application
    init: () => {
        app.setupGlobalEventListeners();
        app.setupNavigation();
        app.initializePage();
    },

    // Setup global event listeners
    setupGlobalEventListeners: () => {
        // Handle navigation clicks
        document.addEventListener('click', (e) => {
            // Login button
            if (e.target.id === 'loginBtn') {
                e.preventDefault();
                window.location.href = 'pages/login.html';
            }

            // Register button
            if (e.target.id === 'registerBtn') {
                e.preventDefault();
                window.location.href = 'pages/register.html';
            }

            // Profile button
            if (e.target.id === 'profileBtn') {
                e.preventDefault();
                window.location.href = 'pages/profile.html';
            }

            // Create post button
            if (e.target.id === 'createPostBtn') {
                e.preventDefault();
                window.location.href = 'pages/create-post.html';
            }
        });

        // Handle pagination clicks
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('page-link')) {
                e.preventDefault();
            }
        });
    },

    // Setup navigation
    setupNavigation: () => {
        // Update navigation based on authentication status
        auth.updateNavigation();
    },

    // Initialize page-specific functionality
    initializePage: () => {
        const path = window.location.pathname;
        
        // Home page
        if (path.endsWith('index.html') || path === '/' || path.endsWith('/')) {
            app.initHomePage();
        }
        
        // Profile page
        if (path.includes('profile.html')) {
            app.initProfilePage();
        }
    },

    // Initialize home page
    initHomePage: () => {
        // Load initial posts
        if (typeof posts !== 'undefined') {
            posts.loadPosts();
        }
    },

    // Initialize profile page
    initProfilePage: () => {
        // Check if user is logged in
        const user = auth.getCurrentUser();
        if (!user) {
            window.location.href = 'login.html';
            return;
        }

        app.loadProfileData(user);
    },

    
    // Load profile data
    loadProfileData: async (user) => {
        try {
            // Load profile info
            const profileInfo = document.getElementById('profileInfo');
            if (profileInfo) {
                profileInfo.innerHTML = `
                    <div class="row">
                        <div class="col-md-8">
                            <h3>${user.name || user.username}</h3>
                            <p class="text-muted">@${user.username}</p>
                            ${user.bio ? `<p>${user.bio}</p>` : ''}
                            <p class="text-muted small">
                                <i class="bi bi-envelope"></i> ${user.email}
                                ${user.contact ? `<br><i class="bi bi-phone"></i> ${user.contact}` : ''}
                                <br><i class="bi bi-calendar"></i> Joined ${utils.formatDate(user.createdAt)}
                            </p>
                        </div>
                    </div>
                `;
            }

            // Load user's posts
            const userPosts = await api.user.getUserPosts(user.id);
            const myPostsList = document.getElementById('myPostsList');
            if (myPostsList) {
                if (userPosts.length === 0) {
                    myPostsList.innerHTML = '<div class="alert alert-info">You haven\'t written any posts yet.</div>';
                } else {
                    myPostsList.innerHTML = userPosts.map(post => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <a href="post-detail.html?id=${post.id}" class="text-decoration-none">
                                        ${post.title}
                                    </a>
                                </h5>
                                <p class="text-muted small">${utils.formatDate(post.createdAt)} • ${post.category}</p>
                                <div class="text-muted small">
                                    <i class="bi bi-eye"></i> ${post.views} views • 
                                    <i class="bi bi-heart"></i> ${post.likes} likes
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }

            // Load recent posts
            const recentPosts = await api.user.getRecentPosts(user.id);
            const recentPostsList = document.getElementById('recentPostsList');
            if (recentPostsList) {
                if (recentPosts.length === 0) {
                    recentPostsList.innerHTML = '<div class="alert alert-info">No recently viewed posts.</div>';
                } else {
                    recentPostsList.innerHTML = recentPosts.map(post => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <a href="post-detail.html?id=${post.id}" class="text-decoration-none">
                                        ${post.title}
                                    </a>
                                </h5>
                                <p class="text-muted small">
                                    By ${post.authorUsername || 'Anonymous'} • ${utils.formatDate(post.createdAt)} • ${post.category}
                                </p>
                                <div class="text-muted small">
                                    <i class="bi bi-eye"></i> ${post.views} views • 
                                    <i class="bi bi-heart"></i> ${post.likes} likes
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }

            // Load liked posts
            const likedPosts = await api.user.getLikedPosts(user.id);
            const likedPostsList = document.getElementById('likedPostsList');
            if (likedPostsList) {
                if (likedPosts.length === 0) {
                    likedPostsList.innerHTML = '<div class="alert alert-info">You haven\'t liked any posts yet.</div>';
                } else {
                    likedPostsList.innerHTML = likedPosts.map(post => `
                        <div class="card mb-3">
                            <div class="card-body">
                                <h5 class="card-title">
                                    <a href="post-detail.html?id=${post.id}" class="text-decoration-none">
                                        ${post.title}
                                    </a>
                                </h5>
                                <p class="text-muted small">
                                    By ${post.authorUsername || 'Anonymous'} • ${utils.formatDate(post.createdAt)} • ${post.category}
                                </p>
                                <div class="text-muted small">
                                    <i class="bi bi-heart-fill text-danger"></i> ${post.likes} likes • 
                                    <i class="bi bi-eye"></i> ${post.views} views
                                </div>
                            </div>
                        </div>
                    `).join('');
                }
            }


        } catch (error) {
            console.error('Error loading profile data:', error);
            utils.showToast('Failed to load profile data', 'danger');
        }
    }
};

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});

// Handle browser back/forward buttons
window.addEventListener('popstate', () => {
    app.initializePage();
});