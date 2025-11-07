// Firebase config

const firebaseConfig = {
  apiKey: 'AIzaSyDkS3LdzhZMW7Tzka9Yia54kL8WXR9llRY',
  authDomain: "personalblog-a72a3.firebaseapp.com",
  projectId: "personalblog-a72a3",
  appId: "1:947793939815:web:36805413993ecba10433c2",
  databaseURL: "https://personalblog-a72a3-default-rtdb.firebaseio.com"

};

// Initialize Firebase - make sure this runs before any Firebase functions are called
firebase.initializeApp(firebaseConfig);

// Login function
function login() {
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  console.log("Login attempt with:", email); // Debug log

  firebase.auth().signInWithEmailAndPassword(email, password)
    .then((userCredential) => {
      console.log("Login successful");
      window.location.href = "dashboard.html";
    })
    .catch((error) => {
      console.error("Login error:", error);
      document.getElementById("error-message").textContent = error.message;
    });
}