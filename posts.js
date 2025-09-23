// Post management functionality
const posts = {
    currentPage: 0,
    totalPages: 0,
    pageSize: 10,

    // Load posts for home page
    loadPosts: async (page = 0, size = 10) => {
        const container = document.getElementById('postsContainer');
        utils.showLoading(container);

        try {
            const response = await api.post.getAll(page, size);
            posts.currentPage = response.number;
            posts.totalPages = response.totalPages;
            posts.renderPosts(response.content);
            posts.renderPagination();
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Failed to load posts</div>';
            console.error('Error loading posts:', error);
        }
    },

    // Render posts
    renderPosts: (postList) => {
        const container = document.getElementById('postsContainer');
        
        if (postList.length === 0) {
            container.innerHTML = '<div class="alert alert-info">No posts found</div>';
            return;
        }

        container.innerHTML = postList.map(post => `
            <div class="card mb-3">
                <div class="card-body">
                    <div class="d-flex justify-content-between align-items-start mb-2">
                        <h5 class="card-title mb-0">
                            <a href="pages/post-detail.html?id=${post.id}" class="text-decoration-none">
                                ${post.title}
                            </a>
                        </h5>
                        <span class="badge bg-secondary">${post.category}</span>
                    </div>
                    <p class="text-muted small mb-2">
                        By ${post.authorUsername || 'Anonymous'} • ${utils.formatDate(post.createdAt)}
                    </p>
                    <div class="d-flex justify-content-between align-items-center">
                        <div class="text-muted small">
                            <i class="bi bi-eye"></i> ${post.views} views • 
                            <i class="bi bi-heart"></i> ${post.likes} likes
                        </div>
                        <a href="pages/post-detail.html?id=${post.id}" class="btn btn-sm btn-outline-primary">
                            Read More
                        </a>
                    </div>
                </div>
            </div>
        `).join('');
    },

    // Render pagination
    renderPagination: () => {
        const pagination = document.getElementById('pagination');
        if (posts.totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }

        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <li class="page-item ${posts.currentPage === 0 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="posts.loadPosts(${posts.currentPage - 1})">Previous</a>
            </li>
        `;

        // Page numbers
        for (let i = 0; i < posts.totalPages; i++) {
            paginationHTML += `
                <li class="page-item ${i === posts.currentPage ? 'active' : ''}">
                    <a class="page-link" href="#" onclick="posts.loadPosts(${i})">${i + 1}</a>
                </li>
            `;
        }

        // Next button
        paginationHTML += `
            <li class="page-item ${posts.currentPage === posts.totalPages - 1 ? 'disabled' : ''}">
                <a class="page-link" href="#" onclick="posts.loadPosts(${posts.currentPage + 1})">Next</a>
            </li>
        `;

        pagination.innerHTML = paginationHTML;
    },

    // Load single post
    loadPost: async (postId) => {
        const container = document.getElementById('postContent');
        utils.showLoading(container);

        try {
            const post = await api.post.getById(postId);
            posts.renderPostDetail(post);
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Failed to load post</div>';
            console.error('Error loading post:', error);
        }
    },


    // Render post detail
    renderPostDetail: (post) => {
        const container = document.getElementById('postContent');
        const currentUser = auth.getCurrentUser();
        
        container.innerHTML = `
            <h1 class="mb-3">${post.title}</h1>
            <div class="d-flex justify-content-between align-items-center mb-3">
                <div class="text-muted">
                    By <strong>${post.authorUsername || 'Anonymous'}</strong> • ${utils.formatDate(post.createdAt)}
                    ${post.updatedAt !== post.createdAt ? `• Updated ${utils.formatDate(post.updatedAt)}` : ''}
                </div>
                <span class="badge bg-secondary">${post.category}</span>
            </div>
            <div class="mb-3 d-flex align-items-center gap-3">
                <span class="text-muted">
                    <i class="bi bi-eye"></i> ${post.views} views
                </span>
            </div>
            <hr>
            <div class="post-content" id="postContentText" style="white-space: pre-line; line-height: 1.6;">
                ${post.content}
            </div>
            
            <!-- Like Section at Bottom -->
            ${currentUser ? `
                <hr>
                <div class="d-flex justify-content-between align-items-center pt-3">
                    <div class="d-flex align-items-center gap-3">
                        <button class="btn btn-outline-danger like-btn" data-post-id="${post.id}" id="likeBtn">
                            <i class="bi bi-heart"></i> <span id="likeCount">${post.likes || 0}</span>
                        </button>
                        <span class="text-muted small">
                            <i class="bi bi-eye"></i> ${post.views || 0} views
                        </span>
                    </div>
                    <div class="text-muted small">
                        Like this post if you found it helpful!
                    </div>
                </div>
            ` : `
                <hr>
                <div class="d-flex justify-content-between align-items-center pt-3">
                    <div class="text-muted">
                        <i class="bi bi-heart"></i> ${post.likes || 0} likes • 
                        <i class="bi bi-eye"></i> ${post.views || 0} views
                    </div>
                    <div class="text-muted small">
                        <a href="../pages/login.html" class="text-decoration-none">Login</a> to like this post
                    </div>
                </div>
            `}
        `;

        // Setup like functionality for logged-in users
        if (currentUser) {
            posts.setupLikeFunctionality(post.id, currentUser.id);
        }

        // Setup view tracking after content is rendered
        posts.setupViewTracking(post.id);
    },

    // Setup like functionality
    setupLikeFunctionality: async (postId, userId) => {
        const likeBtn = document.getElementById('likeBtn');
        if (!likeBtn) return;

        // Check if user has already liked this post
        await posts.checkLikeStatus(postId, userId);

        // Add click event listener
        likeBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            await posts.togglePostLike(postId, userId);
        });
    },

    // Check if user has liked the post
    checkLikeStatus: async (postId, userId) => {
        try {
            // Store like status in session storage to avoid repeated API calls
            const likeStatusKey = `liked_post_${postId}_user_${userId}`;
            var isLiked = sessionStorage.getItem(likeStatusKey) === 'true';
            if(!sessionStorage.getItem(likeStatusKey)){
                isLiked = await api.post.checkLikeStatus(userId, postId);
                sessionStorage.setItem(likeStatusKey, isLiked ? 'true' : 'false');
            }
            const likeBtn = document.getElementById('likeBtn');
            if (likeBtn) {
                posts.updateLikeButton(likeBtn, isLiked);
            }
        } catch (error) {
            console.error('Error checking like status:', error);
        }
    },

    // Toggle post like/unlike
    togglePostLike: async (postId, userId) => {
        const likeBtn = document.getElementById('likeBtn');
        const likeCount = document.getElementById('likeCount');
        
        if (!likeBtn || !likeCount) return;

        // Disable button to prevent multiple clicks
        likeBtn.disabled = true;

        try {
            const likeStatusKey = `liked_post_${postId}_user_${userId}`;
            const isCurrentlyLiked = sessionStorage.getItem(likeStatusKey) === 'true';
            
            let currentCount = parseInt(likeCount.textContent) || 0;

            if (isCurrentlyLiked) {
                // Unlike the post
                await api.post.unlike(userId, postId);
                
                // Update UI
                currentCount = Math.max(0, currentCount - 1);
                likeCount.textContent = currentCount;
                posts.updateLikeButton(likeBtn, false);
                
                // Update session storage
                sessionStorage.setItem(likeStatusKey, 'false');
                
                utils.showToast('Post unliked!', 'info');
            } else {
                // Like the post
                await api.post.like(userId, postId);
                
                // Update UI
                currentCount = currentCount + 1;
                likeCount.textContent = currentCount;
                posts.updateLikeButton(likeBtn, true);
                
                // Update session storage
                sessionStorage.setItem(likeStatusKey, 'true');
                
                utils.showToast('Post liked!', 'success');
            }
        } catch (error) {
            console.error('Error toggling like:', error);
            utils.showToast('Failed to update like. Please try again.', 'danger');
        } finally {
            // Re-enable button
            likeBtn.disabled = false;
        }
    },

    // Update like button appearance
    updateLikeButton: (button, isLiked) => {
        const icon = button.querySelector('i');
        
        if (isLiked) {
            // Liked state
            button.classList.remove('btn-outline-danger');
            button.classList.add('btn-danger');
            icon.classList.remove('bi-heart');
            icon.classList.add('bi-heart-fill');
            button.title = 'Unlike this post';
        } else {
            // Not liked state
            button.classList.remove('btn-danger');
            button.classList.add('btn-outline-danger');
            icon.classList.remove('bi-heart-fill');
            icon.classList.add('bi-heart');
            button.title = 'Like this post';
        }
    },

    // Clear like data for user (useful when logging out)
    clearUserLikeData: (userId) => {
        Object.keys(sessionStorage).forEach(key => {
            if (key.includes(`_user_${userId}`) && key.includes('liked_post_')) {
                sessionStorage.removeItem(key);
            }
        });
    },

    // Setup view tracking functionality
    setupViewTracking: (postId) => {
        const user = auth.getCurrentUser();
        
        // Only track views for logged-in users
        if (!user) {
            return;
        }

        // Check if view already recorded for this session
        const sessionKey = `viewed_post_${postId}`;
        if (sessionStorage.getItem(sessionKey)) {
            return; // Already recorded view in this session
        }

        // Setup intersection observer to detect when user reaches end of post
        const postContent = document.getElementById('postContentText');
        if (!postContent) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach(async (entry) => {
                    // When the end of post content is visible
                    if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                        try {
                            // Record the view
                            await posts.recordView(user.id, postId);
                            
                            // Mark as viewed in session storage
                            sessionStorage.setItem(sessionKey, 'true');
                            
                            // Stop observing after recording view
                            observer.unobserve(entry.target);
                            
                            console.log(`View recorded for post ${postId} by user ${user.id}`);
                        } catch (error) {
                            console.error('Failed to record view:', error);
                        }
                    }
                });
            },
            {
                threshold: 0.5, // Trigger when 50% of the content is visible
                rootMargin: '0px 0px -100px 0px' // Adjust margin to detect near end
            }
        );

        // Start observing the post content
        observer.observe(postContent);

        // Fallback: Record view after user spends sufficient time on page
        posts.setupTimeBasedViewTracking(user.id, postId);
    },

    // Time-based view tracking as fallback
    setupTimeBasedViewTracking: (userId, postId) => {
        const sessionKey = `viewed_post_${postId}`;
        
        // Record view after 30 seconds if not already recorded
        setTimeout(async () => {
            if (!sessionStorage.getItem(sessionKey)) {
                try {
                    await posts.recordView(userId, postId);
                    sessionStorage.setItem(sessionKey, 'true');
                    console.log(`Time-based view recorded for post ${postId} by user ${userId}`);
                } catch (error) {
                    console.error('Failed to record time-based view:', error);
                }
            }
        }, 30000); // 30 seconds
    },

    // Record view API call
    recordView: async (userId, postId) => {
        try {
            await api.post.recordView(userId, postId);
        } catch (error) {
            // Silent fail - view tracking shouldn't disrupt user experience
            console.error('Error recording view:', error);
            throw error;
        }
    },

    // Create new post
    createPost: async (postData) => {
        try {
            const user = auth.getCurrentUser();
            const finalPostData = {
                ...postData,
                authorId: user ? user.id : null
            };

            await api.post.create(finalPostData);
            utils.showToast('Post created successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 1000);
        } catch (error) {
            utils.showToast('Failed to create post', 'danger');
            console.error('Error creating post:', error);
        }
    },

    // Search posts
    searchPosts: async (keyword) => {
        const container = document.getElementById('postsContainer');
        utils.showLoading(container);

        try {
            const postList = await api.post.search(keyword);
            posts.renderPosts(postList);
            // Hide pagination for search results
            document.getElementById('pagination').innerHTML = '';
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Search failed</div>';
            console.error('Error searching posts:', error);
        }
    },

    // Filter by category
    filterByCategory: async (category) => {
        const container = document.getElementById('postsContainer');
        utils.showLoading(container);

        try {
            const postList = category ? await api.post.getByCategory(category) : await api.post.getAll(0, 10);
            if (category) {
                posts.renderPosts(postList);
                // Hide pagination for filtered results
                document.getElementById('pagination').innerHTML = '';
            } else {
                posts.currentPage = postList.number || 0;
                posts.totalPages = postList.totalPages || 1;
                posts.renderPosts(postList.content || postList);
                posts.renderPagination();
            }
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Filter failed</div>';
            console.error('Error filtering posts:', error);
        }
    }
};

// Initialize posts functionality on page load
document.addEventListener('DOMContentLoaded', () => {
    // Load posts on home page
    if (document.getElementById('postsContainer')) {
        posts.loadPosts();
    }

    // Load single post on detail page
    const urlParams = utils.getUrlParams();
    if (urlParams.id && document.getElementById('postContent')) {
        posts.loadPost(urlParams.id);
    }

    // Handle create post form
    const createPostForm = document.getElementById('createPostForm');
    if (createPostForm) {
        createPostForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const postData = {
                title: document.getElementById('title').value,
                content: document.getElementById('content').value,
                category: document.getElementById('category').value
            };
            
            await posts.createPost(postData);
        });
    }

    // Handle search
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    if (searchBtn && searchInput) {
        searchBtn.addEventListener('click', () => {
            const keyword = searchInput.value.trim();
            if (keyword) {
                posts.searchPosts(keyword);
            } else {
                posts.loadPosts();
            }
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                searchBtn.click();
            }
        });
    }

    // Handle category filter
    const categoryFilter = document.getElementById('categoryFilter');
    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            posts.filterByCategory(e.target.value);
        });
    }
});