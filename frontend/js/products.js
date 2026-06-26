// products.js - Product Display and Management

// Load and display products
async function loadProducts(params = {}) {
  try {
    const response = await Products.getAll(params);
    
    if (response.success) {
      displayProducts(response.data);
      updatePagination(response.pagination);
    }
  } catch (error) {
    showNotification('Failed to load products', 'error');
    console.error('Error loading products:', error);
  }
}

// Display products in grid
function displayProducts(products) {
  const productsContainer = document.getElementById('products-grid');
  
  if (!productsContainer) return;

  productsContainer.innerHTML = '';

  products.forEach(product => {
    const discountedPrice = product.discount 
      ? Math.round(product.price * (1 - product.discount / 100))
      : product.price;

    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${product.images[0] || '/images/placeholder.jpg'}" alt="${product.name}">
        ${product.discount ? `<div class="discount-badge">${product.discount}% OFF</div>` : ''}
      </div>
      <div class="product-info">
        <h3 class="product-name">${product.name}</h3>
        <div class="product-rating">
          <span class="stars">${getStarRating(product.rating)}</span>
          <span class="rating-value">${product.rating || 0}</span>
        </div>
        <div class="product-price">
          ${product.discount ? `<span class="original-price">₹${product.price}</span>` : ''}
          <span class="final-price">₹${discountedPrice}</span>
        </div>
        <div class="product-stock ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
          ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
        </div>
        <div class="product-actions">
          <button class="btn-primary" onclick="viewProduct('${product._id}')" ${product.stock === 0 ? 'disabled' : ''}>
            View Details
          </button>
          <button class="btn-secondary" onclick="addToWishlist('${product._id}')" title="Add to Wishlist">
            <i class="heart-icon">♡</i>
          </button>
        </div>
      </div>
    `;

    productsContainer.appendChild(productCard);
  });
}

// Get star rating display
function getStarRating(rating) {
  const fullStars = Math.floor(rating || 0);
  const hasHalfStar = (rating || 0) % 1 >= 0.5;
  
  let stars = '★'.repeat(fullStars);
  if (hasHalfStar) stars += '½';
  stars += '☆'.repeat(5 - Math.ceil(rating || 0));
  
  return stars;
}

// View single product
async function viewProduct(productId) {
  try {
    const response = await Products.getById(productId);
    
    if (response.success) {
      // Store product data and redirect
      sessionStorage.setItem('selectedProduct', JSON.stringify(response.data));
      window.location.href = `/product-detail.html?id=${productId}`;
    }
  } catch (error) {
    showNotification('Failed to load product details', 'error');
  }
}

// Display product details
async function loadProductDetail(productId) {
  try {
    const response = await Products.getById(productId);
    
    if (response.success) {
      displayProductDetail(response.data);
      loadProductReviews(productId);
    }
  } catch (error) {
    showNotification('Failed to load product', 'error');
  }
}

// Display detailed product information
function displayProductDetail(product) {
  const container = document.getElementById('product-detail');
  if (!container) return;

  const discountedPrice = product.discount 
    ? Math.round(product.price * (1 - product.discount / 100))
    : product.price;

  container.innerHTML = `
    <div class="product-detail-container">
      <div class="product-images">
        <div class="main-image">
          <img id="main-product-image" src="${product.images[0]}" alt="${product.name}">
        </div>
        <div class="thumbnail-images">
          ${product.images.map((img, idx) => `
            <img src="${img}" alt="Product ${idx + 1}" onclick="changeProductImage('${img}')" class="thumbnail ${idx === 0 ? 'active' : ''}">
          `).join('')}
        </div>
      </div>

      <div class="product-details">
        <h1>${product.name}</h1>
        
        <div class="product-meta">
          <div class="rating">
            <span class="stars">${getStarRating(product.rating)}</span>
            <span class="rating-text">${product.totalReviews} reviews</span>
          </div>
          <div class="stock-status ${product.stock > 0 ? 'in-stock' : 'out-of-stock'}">
            ${product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
          </div>
        </div>

        <div class="price-section">
          ${product.discount ? `<span class="original-price">₹${product.price}</span>` : ''}
          <span class="final-price">₹${discountedPrice}</span>
          ${product.discount ? `<span class="discount-percentage">${product.discount}% OFF</span>` : ''}
        </div>

        <p class="description">${product.description}</p>

        <div class="product-options">
          ${product.sizes.length > 0 ? `
            <div class="size-selector">
              <label>Select Size:</label>
              <div class="sizes">
                ${product.sizes.map(size => `
                  <button class="size-btn" data-size="${size}" onclick="selectSize('${size}')">${size}</button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          ${product.colors.length > 0 ? `
            <div class="color-selector">
              <label>Select Color:</label>
              <div class="colors">
                ${product.colors.map(color => `
                  <button class="color-btn" data-color="${color}" onclick="selectColor('${color}')" title="${color}">
                    <span class="color-box" style="background-color: ${getColorCode(color)}"></span>
                  </button>
                `).join('')}
              </div>
            </div>
          ` : ''}

          <div class="quantity-selector">
            <label>Quantity:</label>
            <div class="quantity">
              <button onclick="decreaseQuantity()">−</button>
              <input type="number" id="quantity" value="1" min="1" max="${product.stock}">
              <button onclick="increaseQuantity()">+</button>
            </div>
          </div>
        </div>

        <div class="action-buttons">
          <button class="btn-primary btn-large" onclick="addProductToCart('${product._id}')" ${product.stock === 0 ? 'disabled' : ''}>
            Add to Cart
          </button>
          <button class="btn-secondary btn-large" onclick="addProductToWishlist('${product._id}')">
            Add to Wishlist
          </button>
        </div>

        <div class="product-features">
          <h3>Key Features</h3>
          <ul>
            <li>100% Authentic</li>
            <li>Free Shipping on orders above ₹500</li>
            <li>Easy Returns within 7 days</li>
            <li>Secure Payment Options</li>
          </ul>
        </div>
      </div>
    </div>
  `;

  // Set initial size and color
  if (product.sizes.length > 0) {
    document.querySelector('.size-btn')?.classList.add('selected');
    window.selectedSize = product.sizes[0];
  }
  if (product.colors.length > 0) {
    document.querySelector('.color-btn')?.classList.add('selected');
    window.selectedColor = product.colors[0];
  }

  window.currentProduct = product;
}

// Change main product image
function changeProductImage(imageUrl) {
  document.getElementById('main-product-image').src = imageUrl;
  document.querySelectorAll('.thumbnail').forEach(img => img.classList.remove('active'));
  event.target.classList.add('active');
}

// Select size
function selectSize(size) {
  window.selectedSize = size;
  document.querySelectorAll('.size-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');
}

// Select color
function selectColor(color) {
  window.selectedColor = color;
  document.querySelectorAll('.color-btn').forEach(btn => btn.classList.remove('selected'));
  event.target.classList.add('selected');
}

// Increase quantity
function increaseQuantity() {
  const input = document.getElementById('quantity');
  const max = window.currentProduct?.stock || 10;
  if (parseInt(input.value) < max) {
    input.value = parseInt(input.value) + 1;
  }
}

// Decrease quantity
function decreaseQuantity() {
  const input = document.getElementById('quantity');
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
  }
}

// Add product to cart
async function addProductToCart(productId) {
  if (!isLoggedIn()) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  try {
    const quantity = parseInt(document.getElementById('quantity').value) || 1;
    const size = window.selectedSize;
    const color = window.selectedColor;

    const response = await Cart.add(productId, quantity, size, color);

    if (response.success) {
      showNotification('Added to cart!', 'success');
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification('Failed to add to cart', 'error');
  }
}

// Add to wishlist
async function addProductToWishlist(productId) {
  if (!isLoggedIn()) {
    window.location.href = `/login.html?redirect=${encodeURIComponent(window.location.pathname)}`;
    return;
  }

  try {
    const response = await Wishlist.add(productId);

    if (response.success) {
      showNotification('Added to wishlist!', 'success');
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification('Failed to add to wishlist', 'error');
  }
}

// Load product reviews
async function loadProductReviews(productId) {
  try {
    const response = await Reviews.getByProduct(productId);

    if (response.success) {
      displayReviews(response.data);
    }
  } catch (error) {
    console.error('Failed to load reviews:', error);
  }
}

// Display reviews
function displayReviews(reviews) {
  const reviewsContainer = document.getElementById('product-reviews');
  if (!reviewsContainer) return;

  reviewsContainer.innerHTML = '<h3>Customer Reviews</h3>';

  if (reviews.length === 0) {
    reviewsContainer.innerHTML += '<p>No reviews yet. Be the first to review!</p>';
    return;
  }

  const reviewsList = document.createElement('div');
  reviewsList.className = 'reviews-list';

  reviews.forEach(review => {
    const reviewEl = document.createElement('div');
    reviewEl.className = 'review-item';
    reviewEl.innerHTML = `
      <div class="review-header">
        <strong>${review.user.name}</strong>
        <span class="review-rating">${getStarRating(review.rating)}</span>
      </div>
      <p class="review-comment">${review.comment || 'No comment'}</p>
      <small class="review-date">${new Date(review.createdAt).toLocaleDateString()}</small>
    `;
    reviewsList.appendChild(reviewEl);
  });

  reviewsContainer.appendChild(reviewsList);
}

// Get color code
function getColorCode(colorName) {
  const colors = {
    'Black': '#000000',
    'White': '#ffffff',
    'Red': '#ff0000',
    'Blue': '#0000ff',
    'Green': '#00aa00',
    'Yellow': '#ffff00',
    'Pink': '#ff69b4',
    'Purple': '#800080',
    'Orange': '#ff8800',
    'Gray': '#808080'
  };
  return colors[colorName] || '#cccccc';
}

// Update pagination
function updatePagination(pagination) {
  const paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  paginationEl.innerHTML = '';

  if (pagination.pages > 1) {
    for (let i = 1; i <= pagination.pages; i++) {
      const button = document.createElement('button');
      button.textContent = i;
      button.className = i === pagination.page ? 'active' : '';
      button.onclick = () => loadProducts({ ...window.currentFilters, page: i });
      paginationEl.appendChild(button);
    }
  }
}

// Search products
async function searchProducts() {
  const query = document.getElementById('search-input').value;
  
  if (query.trim()) {
    try {
      const response = await Products.search(query);
      if (response.success) {
        displayProducts(response.data);
      }
    } catch (error) {
      showNotification('Search failed', 'error');
    }
  }
}

// Initialize products on page load
document.addEventListener('DOMContentLoaded', () => {
  const productId = new URLSearchParams(window.location.search).get('id');
  
  if (productId) {
    loadProductDetail(productId);
  } else if (document.getElementById('products-grid')) {
    loadProducts();
  }
});