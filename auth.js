// auth.js - Authentication and User Management

// Save token and user data
function saveAuth(token, user) {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  updateAuthUI();
}

// Get current user
function getCurrentUser() {
  const user = localStorage.getItem('user');
  return user ? JSON.parse(user) : null;
}

// Check if logged in
function isLoggedIn() {
  return !!localStorage.getItem('token');
}

// Logout user
async function logoutUser() {
  try {
    await Auth.logout();
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    updateAuthUI();
    window.location.href = '/index.html';
  } catch (error) {
    console.error('Logout error:', error);
  }
}

// Update UI based on auth status
function updateAuthUI() {
  const user = getCurrentUser();
  const authButtons = document.getElementById('auth-buttons');
  const userMenu = document.getElementById('user-menu');
  const userName = document.getElementById('user-name');

  if (isLoggedIn() && user) {
    if (authButtons) {
      authButtons.style.display = 'none';
    }
    if (userMenu) {
      userMenu.style.display = 'block';
      if (userName) {
        userName.textContent = user.name || user.email;
      }
    }
  } else {
    if (authButtons) {
      authButtons.style.display = 'block';
    }
    if (userMenu) {
      userMenu.style.display = 'none';
    }
  }
}

// Handle registration form
async function handleRegister(e) {
  e.preventDefault();
  
  const name = document.getElementById('reg-name').value;
  const email = document.getElementById('reg-email').value;
  const phone = document.getElementById('reg-phone').value;
  const password = document.getElementById('reg-password').value;
  const confirmPassword = document.getElementById('reg-confirm-password').value;

  try {
    const response = await Auth.register(name, email, phone, password, confirmPassword);
    
    if (response.success) {
      saveAuth(response.token, response.data);
      showNotification('Registration successful!', 'success');
      window.location.href = '/index.html';
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification(error.message || 'Registration failed', 'error');
  }
}

// Handle login form
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;

  try {
    const response = await Auth.login(email, password);
    
    if (response.success) {
      saveAuth(response.token, response.data);
      showNotification('Login successful!', 'success');
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/index.html';
      window.location.href = redirectUrl;
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification(error.message || 'Login failed', 'error');
  }
}

// Redirect to login if not authenticated
function requireAuth() {
  if (!isLoggedIn()) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
    color: white;
    border-radius: 4px;
    box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideIn 0.3s ease;
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Initialize auth on page load
document.addEventListener('DOMContentLoaded', updateAuthUI);