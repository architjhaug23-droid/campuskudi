// Admin Login Handler
document.addEventListener('DOMContentLoaded', () => {
  const adminLoginForm = document.getElementById('adminLoginForm');
  const notificationMessage = document.getElementById('notificationMessage');
  const buttonText = document.getElementById('buttonText');
  const loadingSpinner = document.getElementById('loadingSpinner');

  if (adminLoginForm) {
    adminLoginForm.addEventListener('submit', handleAdminLogin);
  }

  async function handleAdminLogin(e) {
    e.preventDefault();

    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    // Validation
    if (!email || !password) {
      showNotification('Please fill in all fields', 'error');
      return;
    }

    if (!email.includes('@')) {
      showNotification('Please enter a valid email', 'error');
      return;
    }

    if (password.length < 6) {
      showNotification('Password must be at least 6 characters', 'error');
      return;
    }

    // Show loading
    buttonText.style.display = 'none';
    loadingSpinner.style.display = 'inline-block';
    document.querySelector('.admin-login-btn').disabled = true;

    try {
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Save admin token
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('adminEmail', email);

        showNotification('Login successful! Redirecting...', 'success');

        // Redirect after 1 second
        setTimeout(() => {
          window.location.href = './admin-panel.html';
        }, 1000);
      } else {
        showNotification(data.message || 'Login failed', 'error');
      }
    } catch (error) {
      console.error('Login error:', error);
      showNotification('Failed to connect to server', 'error');
    } finally {
      // Hide loading
      buttonText.style.display = 'inline';
      loadingSpinner.style.display = 'none';
      document.querySelector('.admin-login-btn').disabled = false;
    }
  }

  function showNotification(message, type) {
    notificationMessage.textContent = message;
    notificationMessage.className = `admin-notification ${type}`;

    // Auto hide after 5 seconds
    setTimeout(() => {
      notificationMessage.className = 'admin-notification';
    }, 5000);
  }
});
