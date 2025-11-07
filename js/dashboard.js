// Firebase configuration


const firebaseConfig = {
  apiKey: 'AIzaSyDkS3LdzhZMW7Tzka9Yia54kL8WXR9llRY',
  authDomain: "personalblog-a72a3.firebaseapp.com",
  projectId: "personalblog-a72a3",
  appId: "1:947793939815:web:36805413993ecba10433c2",
  databaseURL: "https://personalblog-a72a3-default-rtdb.firebaseio.com"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// Check authentication state
auth.onAuthStateChanged((user) => {
  if (!user) {
    // If not signed in, redirect to login page
    window.location.href = "login.html";
  } else {
    // Load posts if authenticated
    loadPosts();
  }
});

// DOM Elements
const newPostBtn = document.getElementById("newPostBtn");
const newPostModal = document.getElementById("newPostModal");
const closeModal = document.querySelector(".close-modal");
const newPostForm = document.getElementById("newPostForm");
const postsList = document.getElementById("postsList");

// Event Listeners
newPostBtn.addEventListener("click", () => {
  window.location.href = "post-creation.html";
});

closeModal.addEventListener("click", () => {
  newPostModal.style.display = "none";
});

window.addEventListener("click", (event) => {
  if (event.target === newPostModal) {
    newPostModal.style.display = "none";
  }
});

newPostForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const title = document.getElementById("postTitle").value.trim();
  const content = document.getElementById("postContent").value.trim();

  if (title && content) {
    addNewPost(title, content);
  }
});

// Load posts from Firebase
function loadPosts() {
  // Clear existing posts
  postsList.innerHTML = "";

  db.collection("posts")
    .orderBy("createdAt", "desc")
    .get()
    .then((querySnapshot) => {
      if (querySnapshot.empty) {
        postsList.innerHTML = "<p>No posts yet. Create your first post!</p>";
      } else {
        querySnapshot.forEach((doc) => {
          const post = doc.data();
          const postElement = createPostElement(doc.id, post);
          postsList.appendChild(postElement);
        });
      }
    })
    .catch((error) => {
      console.error("Error loading posts:", error);
    });
}

// Create a post element
function createPostElement(id, post) {
  // Format date
  const date = post.createdAt ? new Date(post.createdAt.toDate()) : new Date();
  const formattedDate = `${date.getDate()} ${getMonthName(date.getMonth())}, ${date.getFullYear()}`;

  // Create post element
  const postDiv = document.createElement("div");
  postDiv.className = "post-item";
  postDiv.innerHTML = `
      <div class="post-content">
        <h3>${post.title}</h3>
        <span class="post-date">• ${formattedDate}</span>
      </div>
      <div class="post-actions">
        <button class="more-options-btn">⋮</button>
        <div class="options-dropdown">
          <a href="#" class="edit-option" data-id="${id}">EDIT</a>
          <a href="#" class="delete-option" data-id="${id}">DELETE</a>
        </div>
      </div>
    `;

  // Add event listeners for edit and delete
  postDiv.querySelector(".edit-option").addEventListener("click", (e) => {
    e.preventDefault();
    window.location.href = `post-creation.html?id=${id}`;
  });

  postDiv.querySelector(".delete-option").addEventListener("click", (e) => {
    e.preventDefault();
    deletePost(id);
  });

  return postDiv;
}

// Add a new post
function addNewPost(title, content) {
  db.collection("posts").add({
    title: title,
    content: content,
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => {
      // Reset form and close modal
      newPostForm.reset();
      newPostModal.style.display = "none";

      // Reload posts
      loadPosts();
    })
    .catch((error) => {
      console.error("Error adding post:", error);
    });
}

// Edit post function
function editPost(id) {
  // Get post data
  db.collection("posts").doc(id).get()
    .then((doc) => {
      if (doc.exists) {
        const post = doc.data();

        // Show modal with existing data
        document.getElementById("postTitle").value = post.title;
        document.getElementById("postContent").value = post.content;

        // Change form submission behavior
        newPostForm.onsubmit = (e) => {
          e.preventDefault();

          const updatedTitle = document.getElementById("postTitle").value.trim();
          const updatedContent = document.getElementById("postContent").value.trim();

          updatePost(id, updatedTitle, updatedContent);
        };

        newPostModal.style.display = "block";
      }
    });
}

// Update post
function updatePost(id, title, content) {
  db.collection("posts").doc(id).update({
    title: title,
    content: content,
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  })
    .then(() => {
      // Reset form and close modal
      newPostForm.reset();
      newPostModal.style.display = "none";

      // Reset form submission behavior
      newPostForm.onsubmit = (e) => {
        e.preventDefault();

        const title = document.getElementById("postTitle").value.trim();
        const content = document.getElementById("postContent").value.trim();

        if (title && content) {
          addNewPost(title, content);
        }
      };

      // Reload posts
      loadPosts();
    })
    .catch((error) => {
      console.error("Error updating post:", error);
    });
}

// Delete post
function deletePost(id) {
  if (confirm("Are you sure you want to delete this post?")) {
    db.collection("posts").doc(id).delete()
      .then(() => {
        loadPosts();
      })
      .catch((error) => {
        console.error("Error deleting post:", error);
      });
  }
}

// Helper function to get month name
function getMonthName(monthIndex) {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[monthIndex];
}