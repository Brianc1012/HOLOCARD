// Simple login logic using AJAX
// In production, use a backend for authentication!

document.getElementById('loginForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  const formData = new FormData();
  formData.append('email', email);
  formData.append('password', password);

  try {
    const res = await fetch('../api/login.php', {
      method: 'POST',
      body: formData
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
