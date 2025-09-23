// API service for handling HTTP requests
const api = {
    // Generic request handler
    request: async (endpoint, options = {}) => {
        const url = `${BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'X-API-KEY': 'SATHISH',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            // Handle empty responses
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    },

    // User APIs
    user: {
        register: (userData) => api.request('/api/users/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

        login: (credentials) => api.request('/api/users/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),

        getById: (id) => api.request(`/api/users/${id}`),

        getByUsername: (username) => api.request(`/api/users/username/${username}`),

        update: (id, userData) => api.request(`/api/users/${id}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        }),

        getUserPosts: (id) => api.request(`/api/users/${id}/posts`),

        getRecentPosts: (id) => api.request(`/api/users/${id}/recent-posts`),

        getLikedPosts: (id) => api.request(`/api/users/${id}/liked-posts`),

        delete: (id) => api.request(`/api/users/${id}`, {
            method: 'DELETE'
        })
    },

    // Post APIs
    post: {
        getAll: (page = 0, size = 10) => api.request(`/api/posts?page=${page}&size=${size}`),

        getById: (id) => api.request(`/api/posts/${id}`),

        create: (postData) => api.request('/api/posts', {
            method: 'POST',
            body: JSON.stringify(postData)
        }),

        update: (id, postData) => api.request(`/api/posts/${id}`, {
            method: 'PUT',
            body: JSON.stringify(postData)
        }),

        delete: (id) => api.request(`/api/posts/${id}`, {
            method: 'DELETE'
        }),

        getByCategory: (category) => api.request(`/api/posts/category/${category}`),

        search: (keyword) => api.request(`/api/posts/search?keyword=${encodeURIComponent(keyword)}`),

        recordView: (userId, postId) => api.request('/api/posts/view', {
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                postId: postId
            })
        }),

        // Add like post API
        like: (userId, postId) => api.request('/api/posts/like', {
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                postId: postId
            })
        }),

        // Add unlike post API
        unlike: (userId, postId) => api.request('/api/posts/unlike', {
            method: 'DELETE',
            body: JSON.stringify({
                userId: userId,
                postId: postId
            })
        }),

        // Check if user has liked a post
        checkLikeStatus: (userId, postId) => api.request('/api/posts/check-like', {
            method: 'POST',
            body: JSON.stringify({
                userId: userId,
                postId: postId
            })
        })
    },

    // Comment APIs
    comment: {
        getByPostId: (postId) => api.request(`/api/comments/post/${postId}`),

        create: (commentData) => api.request('/api/comments', {
            method: 'POST',
            body: JSON.stringify(commentData)
        }),

        update: (id, commentData) => api.request(`/api/comments/${id}`, {
            method: 'PUT',
            body: JSON.stringify(commentData)
        }),

        delete: (id) => api.request(`/api/comments/${id}`, {
            method: 'DELETE'
        })
    }
};