// Simple signup logic using AJAX
// In production, use a backend for authentication!

document.getElementById('signupForm').addEventListener('submit', async function(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!/^\S+@\S+\.\S+$/.test(email)) {
    alert('Invalid email format.');
    return;
  }
  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  const formData = new FormData();
  formData.append('name', name);
  formData.append('email', email);
  formData.append('password', password);

  try {
    const res = await fetch('../api/signup.php', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (data.success) {
      alert('Signup successful! You can now log in.');
      window.location.href = 'login.html';
    } else {
      alert(data.message || 'Signup failed.');
    }
  } catch (err) {
    alert('Server error. Please try again.');
  }
});
