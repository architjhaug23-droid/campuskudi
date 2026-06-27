// Admin Panel Handler
document.addEventListener('DOMContentLoaded', () => {
  // Check if admin is logged in
  const adminToken = localStorage.getItem('adminToken');
  const adminEmail = localStorage.getItem('adminEmail');

  if (!adminToken) {
    window.location.href = './admin-login.html';
    return;
  }

  // Display admin info
  document.getElementById('adminEmail').textContent = adminEmail;
  const initial = adminEmail ? adminEmail.charAt(0).toUpperCase() : 'A';
  document.getElementById('adminInitial').textContent = initial;

  // Set up API client with admin token
  const headers = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json',
  };

  // Sidebar navigation
  const menuItems = document.querySelectorAll('.admin-menu-item');
  const sections = document.querySelectorAll('.admin-section');

  menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      const sectionId = e.target.dataset.section;

      // Remove active class from all items
      menuItems.forEach(mi => mi.classList.remove('active'));
      sections.forEach(s => s.classList.remove('active'));

      // Add active class to clicked item
      e.target.classList.add('active');
      document.getElementById(sectionId).classList.add('active');

      // Load data for section
      loadSectionData(sectionId);
    });
  });

  // Logout button
  document.getElementById('logoutBtn').addEventListener('click', () => {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminEmail');
    window.location.href = './admin-login.html';
  });

  // Load initial data
  loadDashboardData();

  // Form handlers
  setupProductForm();
  setupCouponForm();
  setupCategoryForm();

  // Load initial dashboard
  async function loadDashboardData() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics`, {
        headers,
      });

      const data = await response.json();

      if (data.success) {
        const stats = data.data;
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('totalProducts').textContent = stats.totalProducts || 0;
        document.getElementById('totalOrders').textContent = stats.totalOrders || 0;
        document.getElementById('totalRevenue').textContent = `₹${stats.totalRevenue || 0}`;
        document.getElementById('monthlyRevenue').textContent = `₹${stats.monthlyRevenue || 0}`;
        document.getElementById('newUsers').textContent = stats.newUsers || 0;
        document.getElementById('avgOrderValue').textContent = `₹${stats.avgOrderValue || 0}`;
        document.getElementById('totalReviews').textContent = stats.totalReviews || 0;
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  }

  async function loadSectionData(section) {
    switch (section) {
      case 'products':
        loadProducts();
        break;
      case 'orders':
        loadOrders();
        break;
      case 'users':
        loadUsers();
        break;
      case 'reviews':
        loadReviews();
        break;
      case 'coupons':
        loadCoupons();
        break;
      case 'categories':
        loadCategories();
        break;
    }
  }

  async function loadProducts() {
    try {
      const response = await fetch(`${API_BASE_URL}/products`, {
        headers,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const tbody = document.getElementById('productsTableBody');
        tbody.innerHTML = data.data.map(product => `
          <tr>
            <td>${product.name}</td>
            <td>₹${product.price}</td>
            <td>${product.stock}</td>
            <td>${product.category || 'N/A'}</td>
            <td>
              <button class="admin-action-btn btn-edit" onclick="editProduct('${product._id}')">Edit</button>
              <button class="admin-action-btn btn-delete" onclick="deleteProduct('${product._id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      } else {
        document.getElementById('productsTableBody').innerHTML = '<tr><td colspan="5" class="empty-state">No products yet</td></tr>';
      }
    } catch (error) {
      console.error('Error loading products:', error);
      showNotification('Failed to load products', 'error');
    }
  }

  async function loadOrders() {
    try {
      const response = await fetch(`${API_BASE_URL}/orders`, {
        headers,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const tbody = document.getElementById('ordersTableBody');
        tbody.innerHTML = data.data.map(order => `
          <tr>
            <td>${order.orderNumber}</td>
            <td>${order.userId?.name || 'N/A'}</td>
            <td>₹${order.totalAmount || 0}</td>
            <td><span style="background: #ffe; padding: 0.25rem 0.5rem; border-radius: 4px;">${order.orderStatus || 'Pending'}</span></td>
            <td>${new Date(order.createdAt).toLocaleDateString()}</td>
            <td>
              <button class="admin-action-btn btn-view" onclick="viewOrder('${order._id}')">View</button>
            </td>
          </tr>
        `).join('');
      } else {
        document.getElementById('ordersTableBody').innerHTML = '<tr><td colspan="6" class="empty-state">No orders yet</td></tr>';
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      showNotification('Failed to load orders', 'error');
    }
  }

  async function loadUsers() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const tbody = document.getElementById('usersTableBody');
        tbody.innerHTML = data.data.map(user => `
          <tr>
            <td>${user.name}</td>
            <td>${user.email}</td>
            <td>${user.phone}</td>
            <td>${new Date(user.createdAt).toLocaleDateString()}</td>
            <td>
              <button class="admin-action-btn btn-view" onclick="viewUser('${user._id}')">View</button>
            </td>
          </tr>
        `).join('');
      } else {
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="5" class="empty-state">No users yet</td></tr>';
      }
    } catch (error) {
      console.error('Error loading users:', error);
      showNotification('Failed to load users', 'error');
    }
  }

  async function loadReviews() {
    try {
      const response = await fetch(`${API_BASE_URL}/reviews`, {
        headers,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const tbody = document.getElementById('reviewsTableBody');
        tbody.innerHTML = data.data.map(review => `
          <tr>
            <td>${review.productId?.name || 'N/A'}</td>
            <td>${review.userId?.name || 'N/A'}</td>
            <td>${'⭐'.repeat(review.rating)}</td>
            <td>${review.comment.substring(0, 50)}...</td>
            <td>
              <button class="admin-action-btn btn-delete" onclick="deleteReview('${review._id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      } else {
        document.getElementById('reviewsTableBody').innerHTML = '<tr><td colspan="5" class="empty-state">No reviews yet</td></tr>';
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
      showNotification('Failed to load reviews', 'error');
    }
  }

  async function loadCoupons() {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
        headers,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const tbody = document.getElementById('couponsTableBody');
        tbody.innerHTML = data.data.map(coupon => `
          <tr>
            <td><strong>${coupon.code}</strong></td>
            <td>${coupon.discount}%</td>
            <td>${coupon.usedCount || 0} / ${coupon.maxUses}</td>
            <td>${new Date(coupon.expiryDate).toLocaleDateString()}</td>
            <td>
              <button class="admin-action-btn btn-delete" onclick="deleteCoupon('${coupon._id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      } else {
        document.getElementById('couponsTableBody').innerHTML = '<tr><td colspan="5" class="empty-state">No coupons yet</td></tr>';
      }
    } catch (error) {
      console.error('Error loading coupons:', error);
      showNotification('Failed to load coupons', 'error');
    }
  }

  async function loadCategories() {
    try {
      const response = await fetch(`${API_BASE_URL}/categories`, {
        headers,
      });

      const data = await response.json();

      if (data.success && data.data && data.data.length > 0) {
        const tbody = document.getElementById('categoriesTableBody');
        tbody.innerHTML = data.data.map(cat => `
          <tr>
            <td>${cat.name}</td>
            <td>${cat.description || 'N/A'}</td>
            <td>
              <button class="admin-action-btn btn-edit" onclick="editCategory('${cat._id}')">Edit</button>
              <button class="admin-action-btn btn-delete" onclick="deleteCategory('${cat._id}')">Delete</button>
            </td>
          </tr>
        `).join('');
      } else {
        document.getElementById('categoriesTableBody').innerHTML = '<tr><td colspan="3" class="empty-state">No categories yet</td></tr>';
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      showNotification('Failed to load categories', 'error');
    }
  }

  function setupProductForm() {
    const form = document.getElementById('productForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const product = {
          name: document.getElementById('productName').value,
          price: parseFloat(document.getElementById('productPrice').value),
          discount: parseFloat(document.getElementById('productDiscount').value) || 0,
          stock: parseInt(document.getElementById('productStock').value),
          description: document.getElementById('productDescription').value,
          category: document.getElementById('productCategory').value,
          sizes: document.getElementById('productSizes').value.split(',').map(s => s.trim()),
          images: ['https://via.placeholder.com/300x300?text=Product'],
        };

        try {
          const response = await fetch(`${API_BASE_URL}/admin/products`, {
            method: 'POST',
            headers,
            body: JSON.stringify(product),
          });

          const data = await response.json();

          if (data.success) {
            showNotification('Product added successfully!', 'success');
            form.reset();
            loadProducts();
          } else {
            showNotification(data.message || 'Failed to add product', 'error');
          }
        } catch (error) {
          console.error('Error adding product:', error);
          showNotification('Failed to add product', 'error');
        }
      });
    }
  }

  function setupCouponForm() {
    const form = document.getElementById('couponForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const coupon = {
          code: document.getElementById('couponCode').value.toUpperCase(),
          discount: parseFloat(document.getElementById('couponDiscount').value),
          discountType: 'percentage',
          maxUses: parseInt(document.getElementById('couponMaxUses').value),
          expiryDate: document.getElementById('couponExpiry').value,
          minOrderValue: 0,
        };

        try {
          const response = await fetch(`${API_BASE_URL}/admin/coupons`, {
            method: 'POST',
            headers,
            body: JSON.stringify(coupon),
          });

          const data = await response.json();

          if (data.success) {
            showNotification('Coupon created successfully!', 'success');
            form.reset();
            loadCoupons();
          } else {
            showNotification(data.message || 'Failed to create coupon', 'error');
          }
        } catch (error) {
          console.error('Error creating coupon:', error);
          showNotification('Failed to create coupon', 'error');
        }
      });
    }
  }

  function setupCategoryForm() {
    const form = document.getElementById('categoryForm');
    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const category = {
          name: document.getElementById('categoryName').value,
          description: document.getElementById('categoryDescription').value,
        };

        try {
          const response = await fetch(`${API_BASE_URL}/admin/categories`, {
            method: 'POST',
            headers,
            body: JSON.stringify(category),
          });

          const data = await response.json();

          if (data.success) {
            showNotification('Category added successfully!', 'success');
            form.reset();
            loadCategories();
          } else {
            showNotification(data.message || 'Failed to add category', 'error');
          }
        } catch (error) {
          console.error('Error adding category:', error);
          showNotification('Failed to add category', 'error');
        }
      });
    }
  }

  function showNotification(message, type) {
    const notifArea = document.getElementById('notificationArea');
    const notif = document.createElement('div');
    notif.className = `notification ${type}`;
    notif.textContent = message;
    notif.style.display = 'block';
    notifArea.innerHTML = '';
    notifArea.appendChild(notif);

    setTimeout(() => {
      notif.style.display = 'none';
    }, 5000);
  }

  // Global functions for inline onclick handlers
  window.editProduct = (id) => {
    alert('Edit functionality coming soon for product: ' + id);
  };

  window.deleteProduct = async (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/products/${id}`, {
          method: 'DELETE',
          headers,
        });

        const data = await response.json();

        if (data.success) {
          showNotification('Product deleted successfully!', 'success');
          loadProducts();
        }
      } catch (error) {
        showNotification('Failed to delete product', 'error');
      }
    }
  };

  window.viewOrder = (id) => {
    alert('Order details for: ' + id);
  };

  window.viewUser = (id) => {
    alert('User details for: ' + id);
  };

  window.deleteReview = async (id) => {
    if (confirm('Are you sure you want to delete this review?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/reviews/${id}`, {
          method: 'DELETE',
          headers,
        });

        const data = await response.json();

        if (data.success) {
          showNotification('Review deleted successfully!', 'success');
          loadReviews();
        }
      } catch (error) {
        showNotification('Failed to delete review', 'error');
      }
    }
  };

  window.deleteCoupon = async (id) => {
    if (confirm('Are you sure you want to delete this coupon?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/coupons/${id}`, {
          method: 'DELETE',
          headers,
        });

        const data = await response.json();

        if (data.success) {
          showNotification('Coupon deleted successfully!', 'success');
          loadCoupons();
        }
      } catch (error) {
        showNotification('Failed to delete coupon', 'error');
      }
    }
  };

  window.editCategory = (id) => {
    alert('Edit functionality coming soon for category: ' + id);
  };

  window.deleteCategory = async (id) => {
    if (confirm('Are you sure you want to delete this category?')) {
      try {
        const response = await fetch(`${API_BASE_URL}/admin/categories/${id}`, {
          method: 'DELETE',
          headers,
        });

        const data = await response.json();

        if (data.success) {
          showNotification('Category deleted successfully!', 'success');
          loadCategories();
        }
      } catch (error) {
        showNotification('Failed to delete category', 'error');
      }
    }
  };
});
