firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const container = document.getElementById("container");
const signUpBtn = document.getElementById("signUp");
const signInBtn = document.getElementById("signIn");
const mobileSignUpBtn = document.getElementById("mobileSignUp");
const mobileSignInBtn = document.getElementById("mobileSignIn");
const signupForm = document.getElementById("signup-form");
const signinForm = document.getElementById("signin-form");

function showSignUp() {
  container.classList.add("right-panel-active");
}
function showSignIn() {
  container.classList.remove("right-panel-active");
}

if (signUpBtn) signUpBtn.addEventListener("click", showSignUp);
if (signInBtn) signInBtn.addEventListener("click", showSignIn);
if (mobileSignUpBtn) mobileSignUpBtn.addEventListener("click", showSignUp);
if (mobileSignInBtn) mobileSignInBtn.addEventListener("click", showSignIn);

function showNotification(message, type = "error") {
  const existing = document.getElementById("premium-toast");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "premium-toast";
  const bgColor = type === "success" ? "bg-green-600" : "bg-red-500";

  toast.className = `fixed top-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-xl transform transition-all duration-300 translate-y-0 opacity-100 z-[999] flex items-center gap-2`;
  toast.innerHTML = `<span class="font-medium text-sm">${message}</span>`;

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.classList.add("opacity-0", "-translate-y-5");
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

auth.onAuthStateChanged((user) => {
  if (user) {
    // Redirect to dashboard if logged in
    window.location.href = "dashboard.html";
  }
});

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const name = document.getElementById("signup-name").value;
  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;
  const btn = signupForm.querySelector('button[type="submit"]');

  btn.innerText = "Creating...";
  btn.disabled = true;

  try {
    const userCredential = await auth.createUserWithEmailAndPassword(
      email,
      password,
    );
    await userCredential.user.updateProfile({ displayName: name });
    showNotification("Account created successfully!", "success");
  } catch (error) {
    showNotification(error.message, "error");
    btn.innerText = "Sign Up with Email";
    btn.disabled = false;
  }
});

signinForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("signin-email").value;
  const password = document.getElementById("signin-password").value;
  const btn = signinForm.querySelector('button[type="submit"]');

  btn.innerText = "Signing In...";
  btn.disabled = true;

  try {
    await auth.signInWithEmailAndPassword(email, password);
    showNotification("Welcome back!", "success");
  } catch (error) {
    showNotification("Invalid email or password.", "error");
    btn.innerText = "Sign In with Email";
    btn.disabled = false;
  }
});

const googleProvider = new firebase.auth.GoogleAuthProvider();
const googleButtons = document.querySelectorAll(".google-btn");

googleButtons.forEach((btn) => {
  btn.addEventListener("click", async () => {
    const originalContent = btn.innerHTML;
    btn.innerHTML = "Connecting...";
    btn.disabled = true;
    btn.classList.add("opacity-70", "cursor-not-allowed");

    try {
      const result = await auth.signInWithPopup(googleProvider);
      showNotification(
        `Welcome, ${result.user.displayName || "User"}!`,
        "success",
      );
    } catch (error) {
      console.error(error);
      showNotification(error.message, "error");
      btn.innerHTML = originalContent;
      btn.disabled = false;
      btn.classList.remove("opacity-70", "cursor-not-allowed");
    }
  });
});
