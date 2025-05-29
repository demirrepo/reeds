const firebaseConfig = {
  apiKey: "AIzaSyDkS3LdzhZMW7Tzka9Yia54kL8WXR9llRY",
  authDomain: "personalblog-a72a3.firebaseapp.com",
  projectId: "personalblog-a72a3"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Get the post ID from the URL
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

if (postId) {
  db.collection("posts").doc(postId).get()
    .then(doc => {
      if (doc.exists) {
        const post = doc.data();
        document.getElementById("post-title").textContent = post.title;
        document.getElementById("post-content").innerHTML = marked.parse(post.content);
      } else {
        document.getElementById("post-title").textContent = "Post not found.";
      }
    })
    .catch(error => {
      console.error("Error loading post:", error);
    });
} else {
  document.getElementById("post-title").textContent = "Invalid post ID.";
}