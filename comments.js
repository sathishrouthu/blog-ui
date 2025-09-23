// Comment management functionality
const comments = {
    // Load comments for a post
    loadComments: async (postId) => {
        const container = document.getElementById('commentsList');
        utils.showLoading(container);

        try {
            const commentList = await api.comment.getByPostId(postId);
            comments.renderComments(commentList);
        } catch (error) {
            container.innerHTML = '<div class="alert alert-danger">Failed to load comments</div>';
            console.error('Error loading comments:', error);
        }
    },

    // Render comments
    renderComments: (commentList) => {
        const container = document.getElementById('commentsList');
        
        if (commentList.length === 0) {
            container.innerHTML = '<p class="text-muted">No comments yet. Be the first to comment!</p>';
            return;
        }

        container.innerHTML = commentList.map(comment => `
            <div class="border-bottom pb-3 mb-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div>
                        <strong>${comment.username || 'Anonymous'}</strong>
                        <small class="text-muted ms-2">${utils.formatDate(comment.createdAt)}</small>
                    </div>
                </div>
                <p class="mt-2 mb-0" style="white-space: pre-line;">${comment.content}</p>
            </div>
        `).join('');
    },

    // Create new comment
    createComment: async (postId, content) => {
        try {
            const user = auth.getCurrentUser();
            const commentData = {
                postId: parseInt(postId),
                userId: user ? user.id : null,
                content: content
            };

            await api.comment.create(commentData);
            utils.showToast('Comment added successfully!', 'success');
            
            // Reload comments
            comments.loadComments(postId);
            
            // Clear form
            document.getElementById('commentContent').value = '';
        } catch (error) {
            utils.showToast('Failed to add comment', 'danger');
            console.error('Error creating comment:', error);
        }
    },

    // Update comment author info display
    updateAuthorInfo: () => {
        const authorInfo = document.getElementById('authorInfo');
        if (authorInfo) {
            const user = auth.getCurrentUser();
            if (user) {
                authorInfo.textContent = `Commenting as ${user.name || user.username}`;
            } else {
                authorInfo.textContent = 'Commenting as Anonymous';
            }
        }
    }
};

// Initialize comments functionality on page load
document.addEventListener('DOMContentLoaded', () => {
    const urlParams = utils.getUrlParams();
    
    // Load comments if on post detail page
    if (urlParams.id && document.getElementById('commentsList')) {
        comments.loadComments(urlParams.id);
        comments.updateAuthorInfo();
    }

    // Handle comment form
    const commentForm = document.getElementById('commentForm');
    if (commentForm) {
        commentForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const content = document.getElementById('commentContent').value.trim();
            
            if (!content) {
                utils.showToast('Please enter a comment', 'warning');
                return;
            }

            await comments.createComment(urlParams.id, content);
        });
    }
});

