document.addEventListener('DOMContentLoaded', () => {
  const firebaseConfig = {
    apiKey: 'AIzaSyDkS3LdzhZMW7Tzka9Yia54kL8WXR9llRY',
    authDomain: "personalblog-a72a3.firebaseapp.com",
    projectId: "personalblog-a72a3"
  };

  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();

  db.settings({
    cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED,
    ignoreUndefinedProperties: true
  });

  db.enablePersistence().catch(err => {
    if (err.code === 'failed-precondition') {
      console.log('Multiple tabs open, persistence can only be enabled in one tab at a time.');
    } else if (err.code === 'unimplemented') {
      console.log('Persistence not supported in this browser.');
    }
  });

  const postsContainer = document.querySelector(".reads-container");

  // Helpers
  function showLoadingState() { postsContainer.innerHTML = `<div class="loading-container"><div class="loading-spinner"></div><p class="loading-text">Loading posts...</p></div>`; }
  function showEmptyState() { postsContainer.innerHTML = `<div class="empty-container"><div class="empty-icon">📝</div><h3 class="empty-title">No posts yet</h3><p class="empty-message">Be the first to share your thoughts!</p></div>`; }
  function showErrorState(msg) { postsContainer.innerHTML = `<div class="error-container"><div class="error-icon">⚠️</div><h3 class="error-title">Oops! Something went wrong</h3><p class="error-message">${msg}</p><button class="retry-btn" onclick="loadPosts()">Try Again</button></div>`; }

  function calculateReadTime(content) {
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  }

  showLoadingState();

  // Pagination
  let lastDoc = null, isLoading = false, hasMorePosts = true, POSTS_PER_PAGE = 10;

  function debounce(func, wait) {
    let timeout;
    return (...args) => { clearTimeout(timeout); timeout = setTimeout(() => func(...args), wait); };
  }

  function loadPosts(loadMore = false) {
    if (isLoading) return;

    if (!loadMore) { showLoadingState(); lastDoc = null; hasMorePosts = true; }

    isLoading = true;

    let query = db.collection("posts").orderBy("createdAt", "desc").limit(POSTS_PER_PAGE);
    if (loadMore && lastDoc) query = query.startAfter(lastDoc);

    query.get()
      .then(snapshot => {
        isLoading = false;

        if (snapshot.empty && !loadMore) { showEmptyState(); return; }

        if (!loadMore) postsContainer.innerHTML = '';

        const fragment = document.createDocumentFragment();

        snapshot.forEach(doc => {
          const data = doc.data();
          const readTime = calculateReadTime(data.content);
          lastDoc = doc;

          const postEl = document.createElement("a");
          postEl.classList.add("read-post");
          postEl.href = `post.html?id=${doc.id}`;
          postEl.setAttribute('aria-label', `Read post: ${data.title}`);

          const date = data.createdAt.toDate();
          const formattedDate = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

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

        hasMorePosts = snapshot.size === POSTS_PER_PAGE;

        // Load more button
        const existingBtn = postsContainer.querySelector('.load-more-btn');
        if (hasMorePosts && !existingBtn) {
          const btn = document.createElement('button');
          btn.classList.add('load-more-btn');
          btn.textContent = "Load More Posts";
          btn.addEventListener('click', debounce(() => loadPosts(true), 300));
          postsContainer.appendChild(btn);
        } else if (!hasMorePosts && existingBtn) {
          existingBtn.remove();
        }
      })
      .catch(err => { isLoading = false; console.error(err); showErrorState("Failed to load posts."); });
  }

  loadPosts();
});