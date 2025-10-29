import 'dotenv/config';

const firebaseConfig = {
  apiKey: process.env.API_KEY,
  authDomain: "personalblog-a72a3.firebaseapp.com",
  projectId: "personalblog-a72a3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Performance optimizations
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
  ignoreUndefinedProperties: true
});

// Enable offline persistence
db.enablePersistence().catch((err) => {
  if (err.code === 'failed-precondition') {
    console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.log('The current browser does not support all features required for persistence');
  }
});

const postsContainer = document.querySelector(".reads-container");

// Add loading state
function showLoadingState() {
  postsContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-spinner"></div>
        <p class="loading-text">Loading posts...</p>
      </div>
    `;
}

// Add error state
function showErrorState(message) {
  postsContainer.innerHTML = `
      <div class="error-container">
        <div class="error-icon">⚠️</div>
        <h3 class="error-title">Oops! Something went wrong</h3>
        <p class="error-message">${message}</p>
        <button class="retry-btn" onclick="location.reload()">Try Again</button>
      </div>
    `;
}

// Add empty state
function showEmptyState() {
  postsContainer.innerHTML = `
      <div class="empty-container">
        <div class="empty-icon">📝</div>
        <h3 class="empty-title">No posts yet</h3>
        <p class="empty-message">Be the first to share your thoughts!</p>
      </div>
    `;
}

function calculateReadTime(content) {
  const words = content.trim().split(/\s+/).length;
  const wordsPerMinute = 200;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// Show loading state immediately
showLoadingState();

// Add pagination support and performance optimizations
let lastDoc = null;
const POSTS_PER_PAGE = 10;
let isLoading = false;
let hasMorePosts = true;

// Debounce function for performance
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function loadPosts(loadMore = false) {
  // Prevent multiple simultaneous requests
  if (isLoading) return;

  if (!loadMore) {
    showLoadingState();
    lastDoc = null;
    hasMorePosts = true;
  }

  isLoading = true;

  let query = db.collection("posts")
    .orderBy("createdAt", "desc")
    .limit(POSTS_PER_PAGE);

  if (loadMore && lastDoc) {
    query = query.startAfter(lastDoc);
  }

  query.get()
    .then(snapshot => {
      isLoading = false;

      if (snapshot.empty && !loadMore) {
        showEmptyState();
        return;
      }

      if (!loadMore) {
        postsContainer.innerHTML = '';
      }

      // Use DocumentFragment for better performance
      const fragment = document.createDocumentFragment();

      snapshot.forEach(doc => {
        const data = doc.data();
        const readTime = calculateReadTime(data.content);
        lastDoc = doc;

        const postEl = document.createElement("a");
        postEl.classList.add("read-post");
        postEl.href = `post.html?id=${doc.id}`;
        postEl.setAttribute('aria-label', `Read post: ${data.title}`);

        // Optimize date formatting
        const date = data.createdAt.toDate();
        const formattedDate = date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });

        postEl.innerHTML = `
            <div class="text">
              <h2 class="title">${data.title}</h2>
              <div class="meta">
                <span class="date">${formattedDate}</span>
                <span class="read-time">${readTime} min read</span>
              </div>
            </div>
            <div class="arrow" aria-hidden="true">➜</div>
          `;

        fragment.appendChild(postEl);
      });

      postsContainer.appendChild(fragment);

      // Update hasMorePosts flag
      hasMorePosts = snapshot.size === POSTS_PER_PAGE;

      // Add load more button if there are more posts
      if (hasMorePosts) {
        const existingBtn = postsContainer.querySelector('.load-more-btn');
        if (!existingBtn) {
          const loadMoreBtn = document.createElement("button");
          loadMoreBtn.classList.add("load-more-btn");
          loadMoreBtn.textContent = "Load More Posts";
          loadMoreBtn.addEventListener("click", debounce(() => loadPosts(true), 300));
          postsContainer.appendChild(loadMoreBtn);
        }
      } else {
        const existingBtn = postsContainer.querySelector('.load-more-btn');
        if (existingBtn) {
          existingBtn.remove();
        }
      }
    })
    .catch(error => {
      isLoading = false;
      console.error("Error fetching posts:", error);
      showErrorState("Failed to load posts. Please check your connection and try again.");
    });
}

// Load posts on page load
loadPosts();

// Add infinite scroll with Intersection Observer
const observerOptions = {
  root: null,
  rootMargin: '100px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting && hasMorePosts && !isLoading) {
      loadPosts(true);
    }
  });
}, observerOptions);

// Observe the load more button for infinite scroll
const observeLoadMoreBtn = () => {
  const loadMoreBtn = postsContainer.querySelector('.load-more-btn');
  if (loadMoreBtn) {
    observer.observe(loadMoreBtn);
  }
};

// Update observer when new content is added
const originalAppendChild = postsContainer.appendChild;
postsContainer.appendChild = function (child) {
  const result = originalAppendChild.call(this, child);
  if (child.classList && child.classList.contains('load-more-btn')) {
    observeLoadMoreBtn();
  }
  return result;
};