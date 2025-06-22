// Simple login logic using AJAX
// In production, use a backend for authentication!

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  try {
    const res = await fetch('../api/login.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Include session cookies
      body: JSON.stringify({
        email: email,
        password: password
      })
    });
    const data = await res.json();
    if (data.success) {
      // Optionally store user info in sessionStorage/localStorage
      localStorage.setItem('holocard_loggedin', 'true');
      localStorage.setItem('holocard_user', JSON.stringify(data.user));
      window.location.href = 'menuPage.html';
    } else {
      alert(data.message || 'Login failed.');
    }
  } catch (err) {
    alert('Server error. Please try again.');
  }
});
