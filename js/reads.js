const firebaseConfig = {
    apiKey: "AIzaSyDkS3LdzhZMW7Tzka9Yia54kL8WXR9llRY",
    authDomain: "personalblog-a72a3.firebaseapp.com",
    projectId: "personalblog-a72a3"
  };
  
  firebase.initializeApp(firebaseConfig);
  const db = firebase.firestore();
  
  const postsContainer = document.querySelector(".reads-container");
  
  function calculateReadTime(content) {
    const words = content.trim().split(/\s+/).length;
    const wordsPerMinute = 200;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  }
  
  db.collection("posts").orderBy("createdAt", "desc").get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const readTime = calculateReadTime(data.content);
  
        const postEl = document.createElement("a");
        postEl.classList.add("read-post");
        postEl.href = `post.html?id=${doc.id}`;
        postEl.innerHTML = `
          <div class="text">
            <h2 class="title">${data.title}</h2>
            <div class="meta">${new Date(data.createdAt.toDate()).toDateString()} • ${readTime} min read</div>
          </div>
          <div class="arrow">➜</div>
        `;
        postsContainer.appendChild(postEl);
      });
    })
    .catch(error => {
      console.error("Error fetching posts:", error);
    });