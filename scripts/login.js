// Simple login logic using localStorage for demo purposes only
// In production, use a backend for authentication!

document.getElementById('loginForm').addEventListener('submit', function(e) {
  e.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;

  // Get users from localStorage
  const users = JSON.parse(localStorage.getItem('holocard_users') || '[]');
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    localStorage.setItem('holocard_loggedin', 'true');
    localStorage.setItem('holocard_user', JSON.stringify(user));
    window.location.href = 'menuPage.html';
  } else {
    alert('Invalid email or password.');
  }
});
