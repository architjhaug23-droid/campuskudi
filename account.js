// account.js - User Account Management

// Load user account page
async function loadAccountPage() {
  requireAuth();

  const tab = new URLSearchParams(window.location.search).get('tab') || 'profile';

  try {
    const response = await User.getProfile();

    if (response.success) {
      displayAccountPage(response.data, tab);
    }
  } catch (error) {
    showNotification('Failed to load account', 'error');
  }
}

// Display account page
function displayAccountPage(user, activeTab) {
  const container = document.getElementById('account-container');
  
  if (!container) return;

  container.innerHTML = `
    <div class="account-wrapper">
      <div class="account-sidebar">
        <div class="user-card">
          <div class="user-avatar">
            <span>${user.name.charAt(0).toUpperCase()}</span>
          </div>
          <h3>${user.name}</h3>
          <p>${user.email}</p>
        </div>

        <nav class="account-menu">
          <a href="#" onclick="switchTab('profile')" class="menu-item ${activeTab === 'profile' ? 'active' : ''}">
            Profile
          </a>
          <a href="#" onclick="switchTab('orders')" class="menu-item ${activeTab === 'orders' ? 'active' : ''}">
            My Orders
          </a>
          <a href="#" onclick="switchTab('wishlist')" class="menu-item ${activeTab === 'wishlist' ? 'active' : ''}">
            Wishlist
          </a>
          <a href="#" onclick="switchTab('addresses')" class="menu-item ${activeTab === 'addresses' ? 'active' : ''}">
            Addresses
          </a>
          <a href="#" onclick="logoutUser()" class="menu-item logout">
            Logout
          </a>
        </nav>
      </div>

      <div class="account-content">
        ${activeTab === 'profile' ? getProfileTab(user) : ''}
        ${activeTab === 'orders' ? getOrdersTab() : ''}
        ${activeTab === 'wishlist' ? getWishlistTab() : ''}
        ${activeTab === 'addresses' ? getAddressesTab(user) : ''}
      </div>
    </div>
  `;
}

// Switch tabs
function switchTab(tab) {
  window.location.href = `/account.html?tab=${tab}`;
}

// Profile Tab
function getProfileTab(user) {
  return `
    <div class="tab-content profile-tab">
      <h2>Profile Information</h2>
      
      <form id="profile-form" onsubmit="updateProfileInfo(event)">
        <div class="form-group">
          <label>Full Name</label>
          <input type="text" name="name" value="${user.name}" required>
        </div>

        <div class="form-group">
          <label>Email</label>
          <input type="email" value="${user.email}" readonly style="background: #f5f5f5;">
        </div>

        <div class="form-group">
          <label>Phone</label>
          <input type="tel" name="phone" value="${user.phone}" required>
        </div>

        <button type="submit" class="btn-primary">Save Changes</button>
      </form>

      <div class="security-section">
        <h3>Security</h3>
        <div class="security-item">
          <label>Change Password</label>
          <button onclick="openChangePassword()" class="btn-secondary">Change Password</button>
        </div>
      </div>

      <div id="change-password-form" style="display: none;">
        <form onsubmit="changePassword(event)">
          <div class="form-group">
            <label>Current Password</label>
            <input type="password" required>
          </div>
          <div class="form-group">
            <label>New Password</label>
            <input type="password" required>
          </div>
          <div class="form-group">
            <label>Confirm Password</label>
            <input type="password" required>
          </div>
          <button type="submit" class="btn-primary">Update Password</button>
          <button type="button" class="btn-secondary" onclick="closeChangePassword()">Cancel</button>
        </form>
      </div>
    </div>
  `;
}

// Orders Tab
function getOrdersTab() {
  return `
    <div class="tab-content orders-tab">
      <h2>My Orders</h2>
      <div id="orders-list" class="orders-list">Loading...</div>
    </div>
  `;
}

// Wishlist Tab
function getWishlistTab() {
  return `
    <div class="tab-content wishlist-tab">
      <h2>My Wishlist</h2>
      <div id="wishlist-items" class="wishlist-grid">Loading...</div>
    </div>
  `;
}

// Addresses Tab
function getAddressesTab(user) {
  return `
    <div class="tab-content addresses-tab">
      <h2>Saved Addresses</h2>
      
      <div class="address-item">
        <h3>Default Address</h3>
        <p>
          ${user.address?.street || 'Not provided'}<br>
          ${user.address?.city || ''} ${user.address?.state || ''}<br>
          ${user.address?.pincode || ''}<br>
          ${user.address?.country || 'India'}
        </p>
        <button onclick="editAddress()" class="btn-secondary">Edit</button>
      </div>

      <form id="address-form" style="display: none;" onsubmit="updateAddress(event)">
        <div class="form-group">
          <label>Street Address</label>
          <input type="text" name="street" value="${user.address?.street || ''}" required>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>City</label>
            <input type="text" name="city" value="${user.address?.city || ''}" required>
          </div>
          <div class="form-group">
            <label>State</label>
            <input type="text" name="state" value="${user.address?.state || ''}" required>
          </div>
        </div>

        <div class="form-row">
          <div class="form-group">
            <label>Pincode</label>
            <input type="text" name="pincode" value="${user.address?.pincode || ''}" required>
          </div>
          <div class="form-group">
            <label>Country</label>
            <input type="text" name="country" value="${user.address?.country || 'India'}" required>
          </div>
        </div>

        <button type="submit" class="btn-primary">Save Address</button>
        <button type="button" class="btn-secondary" onclick="cancelEditAddress()">Cancel</button>
      </form>
    </div>
  `;
}

// Update profile info
async function updateProfileInfo(event) {
  event.preventDefault();

  const name = event.target.name.value;
  const phone = event.target.phone.value;

  try {
    const response = await User.updateProfile(name, phone);

    if (response.success) {
      const user = response.data;
      localStorage.setItem('user', JSON.stringify(user));
      showNotification('Profile updated successfully!', 'success');
      loadAccountPage();
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification('Failed to update profile', 'error');
  }
}

// Update address
async function updateAddress(event) {
  event.preventDefault();

  const address = {
    street: event.target.street.value,
    city: event.target.city.value,
    state: event.target.state.value,
    pincode: event.target.pincode.value,
    country: event.target.country.value
  };

  try {
    const response = await User.updateProfile(null, null, address);

    if (response.success) {
      showNotification('Address updated successfully!', 'success');
      loadAccountPage();
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification('Failed to update address', 'error');
  }
}

// Edit address
function editAddress() {
  document.getElementById('address-form').style.display = 'block';
}

// Cancel edit address
function cancelEditAddress() {
  document.getElementById('address-form').style.display = 'none';
}

// Open change password
function openChangePassword() {
  document.getElementById('change-password-form').style.display = 'block';
}

// Close change password
function closeChangePassword() {
  document.getElementById('change-password-form').style.display = 'none';
}

// Load and display orders
async function loadUserOrders() {
  try {
    const response = await Orders.getMyOrders();

    if (response.success) {
      displayUserOrders(response.data);
    }
  } catch (error) {
    showNotification('Failed to load orders', 'error');
  }
}

// Display user orders
function displayUserOrders(orders) {
  const container = document.getElementById('orders-list');
  
  if (!container) return;

  if (orders.length === 0) {
    container.innerHTML = '<p>No orders yet. <a href="/collection.html">Start shopping!</a></p>';
    return;
  }

  container.innerHTML = orders.map(order => `
    <div class="order-card">
      <div class="order-header">
        <h4>${order.orderNumber}</h4>
        <span class="order-status ${order.orderStatus.toLowerCase()}">${order.orderStatus}</span>
      </div>

      <div class="order-details">
        <p><strong>Date:</strong> ${new Date(order.createdAt).toLocaleDateString()}</p>
        <p><strong>Items:</strong> ${order.products.length}</p>
        <p><strong>Total:</strong> ₹${order.totalAmount}</p>
      </div>

      <div class="order-actions">
        <a href="/order-tracking.html?orderId=${order._id}" class="btn-secondary">View Details</a>
      </div>
    </div>
  `).join('');
}

// Load and display wishlist
async function loadUserWishlist() {
  try {
    const response = await Wishlist.get();

    if (response.success) {
      displayUserWishlist(response.data.products);
    }
  } catch (error) {
    showNotification('Failed to load wishlist', 'error');
  }
}

// Display user wishlist
function displayUserWishlist(products) {
  const container = document.getElementById('wishlist-items');
  
  if (!container) return;

  if (!products || products.length === 0) {
    container.innerHTML = '<p>Your wishlist is empty. <a href="/collection.html">Add items!</a></p>';
    return;
  }

  container.innerHTML = products.map(product => {
    const discountedPrice = product.discount 
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

    return `
      <div class="wishlist-item">
        <img src="${product.images[0]}" alt="${product.name}">
        <h4>${product.name}</h4>
        <p class="price">₹${discountedPrice}</p>
        <div class="actions">
          <button onclick="viewProduct('${product._id}')" class="btn-primary">View</button>
          <button onclick="removeFromWishlistPage('${product._id}')" class="btn-secondary">Remove</button>
        </div>
      </div>
    `;
  }).join('');
}

// Remove from wishlist
async function removeFromWishlistPage(productId) {
  try {
    const response = await Wishlist.remove(productId);

    if (response.success) {
      showNotification('Removed from wishlist', 'success');
      loadUserWishlist();
    }
  } catch (error) {
    showNotification('Failed to remove from wishlist', 'error');
  }
}

// Initialize account page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('account-container')) {
    loadAccountPage();

    const tab = new URLSearchParams(window.location.search).get('tab') || 'profile';
    if (tab === 'orders') {
      setTimeout(loadUserOrders, 500);
    } else if (tab === 'wishlist') {
      setTimeout(loadUserWishlist, 500);
    }
  }
});