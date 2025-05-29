// Sample blog post data (replace with your content or CMS later)
const posts = [
    { title: "My First Post", excerpt: "This is a short summary of my first blog post.", link: "#" },
    { title: "Another Story", excerpt: "A brief overview of another topic I love.", link: "#" }
  ];
  
  // Dynamically add blog posts
  const postsContainer = document.querySelector(".posts-container");
  posts.forEach(post => {
    const postCard = document.createElement("div");
    postCard.classList.add("post-card");
    postCard.innerHTML = `
      <h3>${post.title}</h3>
      <p>${post.excerpt}</p>
      <a href="${post.link}">Read More</a>
    `;
    postsContainer.appendChild(postCard);
  });