// Simple signup logic using localStorage for demo purposes only
// In production, use a backend for authentication!

document.getElementById('signupForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const name = document.getElementById('signupName').value.trim();
  const email = document.getElementById('signupEmail').value.trim();
  const password = document.getElementById('signupPassword').value;

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    alert('Invalid email format.');
    return;
  }
  if (password.length < 6) {
    alert('Password must be at least 6 characters.');
    return;
  }

  let users = JSON.parse(localStorage.getItem('holocard_users') || '[]');
  if (users.find(u => u.email === email)) {
    alert('Email already registered.');
    return;
  }
  users.push({ name, email, password });
  localStorage.setItem('holocard_users', JSON.stringify(users));
  alert('Signup successful! You can now log in.');
  window.location.href = 'login.html';
});
