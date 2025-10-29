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

// Get the post ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

// Add loading state
function showLoadingState() {
  const postTitle = document.getElementById("post-title");
  const postContent = document.getElementById("post-content");

  postTitle.innerHTML = `
    <div class="loading-skeleton title-skeleton"></div>
  `;
  postContent.innerHTML = `
    <div class="loading-skeleton content-skeleton"></div>
    <div class="loading-skeleton content-skeleton"></div>
    <div class="loading-skeleton content-skeleton short"></div>
  `;
}

// Add error state
function showErrorState(message) {
  const postTitle = document.getElementById("post-title");
  const postContent = document.getElementById("post-content");

  postTitle.textContent = "Error Loading Post";
  postContent.innerHTML = `
    <div class="error-container">
      <div class="error-icon">⚠️</div>
      <h3 class="error-title">Oops! Something went wrong</h3>
      <p class="error-message">${message}</p>
      <button class="retry-btn" onclick="location.reload()">Try Again</button>
    </div>
  `;
}

// Show loading state immediately
showLoadingState();

if (postId) {
  db.collection("posts").doc(postId).get()
    .then(doc => {
      if (doc.exists) {
        const post = doc.data();
        document.getElementById("post-title").textContent = post.title;

        // Parse markdown with error handling
        try {
          const parsedContent = marked.parse(post.content);
          document.getElementById("post-content").innerHTML = parsedContent;
        } catch (error) {
          console.error("Error parsing markdown:", error);
          document.getElementById("post-content").innerHTML = `
            <div class="markdown-error">
              <p>Error rendering content. Here's the raw text:</p>
              <pre>${post.content}</pre>
            </div>
          `;
        }
      } else {
        showErrorState("The post you're looking for doesn't exist or has been removed.");
      }
    })
    .catch(error => {
      console.error("Error loading post:", error);
      showErrorState("Failed to load post. Please check your connection and try again.");
    });
} else {
  showErrorState("Invalid post ID. Please check the URL and try again.");
}