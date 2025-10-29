import 'dotenv/config';

document.addEventListener("DOMContentLoaded", () => {
  // Firebase config
  const firebaseConfig = {
    apiKey: 'AIzaSyDkS3LdzhZMW7Tzka9Yia54kL8WXR9llRY',
    authDomain: "personalblog-a72a3.firebaseapp.com",
    projectId: "personalblog-a72a3",
    storageBucket: "personalblog-a72a3.appspot.com",
    messagingSenderId: "947793939815",
    appId: "1:947793939815:web:36805413993ecba10433c2"
  };

  // Initialize Firebase
  if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
  }
  const auth = firebase.auth();
  const db = firebase.firestore();

  // Check authentication state - skip redirect during development for testing
  let skipAuth = true; // Set to false in production

  auth.onAuthStateChanged((user) => {
    console.log("Auth state changed:", user ? "User logged in" : "No user");
    if (!user && !skipAuth) {
      window.location.href = "login.html";
    } else if (user) {
      console.log("User authenticated:", user.email);
    }
  });

  // DOM Elements
  const publishBtn = document.getElementById("publishBtn");
  const postForm = document.getElementById("postForm");
  const postTitle = document.getElementById("postTitle");
  const postContent = document.getElementById("postContent");
  const formatButtons = document.querySelectorAll(".format-btn");

  // Log when elements are found or not for debugging
  console.log("publishBtn found:", !!publishBtn);
  console.log("postForm found:", !!postForm);
  console.log("postTitle found:", !!postTitle);
  console.log("postContent found:", !!postContent);

  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get("id");

  if (postId) {
    console.log("Loading existing post with ID:", postId);
    loadPostFromStorage(postId);
  }

  // Function to load post (tries Firestore first, falls back to localStorage)
  function loadPostFromStorage(id) {
    // Try Firestore first
    db.collection("posts").doc(id).get()
      .then((doc) => {
        if (doc.exists) {
          const post = doc.data();
          postTitle.value = post.title || "";
          postContent.value = post.content || "";
          console.log("Post data loaded successfully from Firestore");
        } else {
          // If not in Firestore, check localStorage
          tryLoadFromLocalStorage(id);
        }
      })
      .catch((error) => {
        console.error("Error loading post from Firestore:", error);
        // Try localStorage as fallback
        tryLoadFromLocalStorage(id);
      });
  }

  // Helper function to load from localStorage
  function tryLoadFromLocalStorage(id) {
    try {
      const savedPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
      const post = savedPosts.find(p => p.id === id);

      if (post) {
        postTitle.value = post.title || "";
        postContent.value = post.content || "";
        console.log("Post data loaded successfully from localStorage");
      } else {
        console.error("Post not found in any storage");
        alert("Post not found!");
        window.location.href = "dashboard.html";
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
      alert("Error loading post data!");
    }
  }

  // Add event listeners
  publishBtn.addEventListener("click", () => {
    console.log("Publish button clicked");
    if (validateForm()) publishPost();
  });

  postForm.addEventListener("submit", (e) => {
    e.preventDefault();
    console.log("Form submitted");
    if (validateForm()) publishPost();
  });

  function validateForm() {
    if (!postTitle.value.trim()) {
      alert("Please enter a title");
      postTitle.focus();
      return false;
    }

    if (!postContent.value.trim()) {
      alert("Please enter some content");
      postContent.focus();
      return false;
    }

    console.log("Form validation passed");
    return true;
  }

  function publishPost() {
    const title = postTitle.value.trim();
    const content = postContent.value.trim();

    console.log("Publishing post:", title);

    publishBtn.disabled = true;
    publishBtn.textContent = "Publishing...";

    // Save directly to localStorage first as a safety measure
    saveToLocalStorage(title, content, postId);

    // Then try Firestore if user is logged in
    const user = auth.currentUser;
    if (user) {
      saveToFirestore(title, content, user.uid);
    } else {
      // If no user is logged in, just use the localStorage version
      finishPublishing(true);
    }
  }

  function saveToFirestore(title, content, userId) {
    // Create Firestore post data
    const postData = {
      title,
      content,
      userId,
      ...(postId
        ? { updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
        : {
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        })
    };

    console.log("Post data prepared for Firestore:", postData);

    try {
      // Try to save to Firestore
      const postAction = postId
        ? db.collection("posts").doc(postId).update(postData)
        : db.collection("posts").add(postData);

      postAction
        .then((docRef) => {
          console.log("Post saved successfully to Firestore", postId ? "updated" : "created");
          if (!postId && docRef) {
            // For new posts, update the local storage with the Firestore ID
            updateLocalStorageWithFirestoreId(title, content, docRef.id);
            console.log("New post ID:", docRef.id);
          }
          finishPublishing(false);
        })
        .catch((error) => {
          console.error("Error saving to Firestore:", error);
          finishPublishing(true);
        });
    } catch (error) {
      console.error("Exception trying to use Firestore:", error);
      finishPublishing(true);
    }
  }

  function saveToLocalStorage(title, content, existingId = null) {
    try {
      // Get existing posts or initialize empty array
      const savedPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');

      // Check if we're updating an existing post
      if (existingId) {
        const existingIndex = savedPosts.findIndex(post => post.id === existingId);

        if (existingIndex >= 0) {
          // Update existing post
          savedPosts[existingIndex] = {
            ...savedPosts[existingIndex],
            title,
            content,
            updatedAt: new Date().toISOString()
          };
        } else {
          // Add as new if ID not found
          const newPost = {
            id: existingId || Date.now().toString(),
            title,
            content,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          savedPosts.push(newPost);
        }
      } else {
        // Add new post with timestamp
        const newPost = {
          id: Date.now().toString(), // Use timestamp as ID for new local posts
          title,
          content,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        savedPosts.push(newPost);
      }

      localStorage.setItem('blogPosts', JSON.stringify(savedPosts));
      console.log("Post saved to localStorage");
      return true;
    } catch (storageError) {
      console.error("Error saving to localStorage:", storageError);
      return false;
    }
  }

  function updateLocalStorageWithFirestoreId(title, content, firestoreId) {
    try {
      const savedPosts = JSON.parse(localStorage.getItem('blogPosts') || '[]');
      // Find the most recent post with matching title and content
      const matchingPosts = savedPosts.filter(p => p.title === title && p.content === content);
      if (matchingPosts.length > 0) {
        // Sort by created date descending and get the most recent
        matchingPosts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const mostRecent = matchingPosts[0];

        // Remove the old post
        const filteredPosts = savedPosts.filter(p => p.id !== mostRecent.id);

        // Add the updated post with Firestore ID
        filteredPosts.push({
          ...mostRecent,
          id: firestoreId,
          firestoreSync: true
        });

        localStorage.setItem('blogPosts', JSON.stringify(filteredPosts));
        console.log("Updated localStorage with Firestore ID");
      }
    } catch (error) {
      console.error("Error updating localStorage with Firestore ID:", error);
    }
  }

  function finishPublishing(localOnly) {
    const message = localOnly
      ? "Post saved locally. Database connection unavailable."
      : "Post published successfully!";

    alert(message);

    // Reset UI
    publishBtn.disabled = false;
    publishBtn.innerHTML = 'PUBLISH CONTENT <span class="up-arrow">↑</span>';

    // Redirect to dashboard
    window.location.href = "dashboard.html";
  }

  // Formatting buttons
  formatButtons.forEach(button => {
    button.addEventListener("click", () => {
      const format = button.getAttribute("data-format");
      console.log("Formatting applied:", format);
      applyFormatting(format);
    });
  });

  function applyFormatting(format) {
    const textarea = document.getElementById("postContent");
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    let formattedText = "";

    switch (format) {
      case "bold":
        formattedText = `**${selectedText}**`; break;
      case "italic":
        formattedText = `*${selectedText}*`; break;
      case "underline":
        formattedText = `<u>${selectedText}</u>`; break;
      case "strikethrough":
        formattedText = `~~${selectedText}~~`; break;
      case "code":
        formattedText = `\`\`\`\n${selectedText}\n\`\`\``; break;
      case "heading":
        formattedText = `# ${selectedText}`; break;
      default:
        formattedText = selectedText;
    }

    if (selectedText) {
      textarea.value =
        textarea.value.substring(0, start) +
        formattedText +
        textarea.value.substring(end);
    }

    textarea.focus();
  }
});