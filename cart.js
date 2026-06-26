// cart.js - Shopping Cart Management

// Load and display cart
async function loadCart() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }

  try {
    const response = await Cart.get();
    
    if (response.success) {
      displayCart(response.data);
      calculateCartTotals(response.data);
    }
  } catch (error) {
    showNotification('Failed to load cart', 'error');
    console.error('Error loading cart:', error);
  }
}

// Display cart items
function displayCart(cart) {
  const cartContainer = document.getElementById('cart-items');
  
  if (!cartContainer) return;

  if (!cart.items || cart.items.length === 0) {
    cartContainer.innerHTML = `
      <div class="empty-cart">
        <h2>Your cart is empty</h2>
        <p>Start shopping to add items to your cart</p>
        <a href="/collection.html" class="btn-primary">Continue Shopping</a>
      </div>
    `;
    return;
  }

  cartContainer.innerHTML = '';

  cart.items.forEach(item => {
    const discountedPrice = item.discount 
      ? Math.round(item.price * (1 - item.discount / 100))
      : item.price;

    const itemTotal = discountedPrice * item.quantity;

    const cartItem = document.createElement('div');
    cartItem.className = 'cart-item';
    cartItem.innerHTML = `
      <div class="item-image">
        <img src="${item.product.images[0]}" alt="${item.product.name}">
      </div>

      <div class="item-details">
        <h4>${item.product.name}</h4>
        <p class="item-sku">
          ${item.size ? `Size: ${item.size}` : ''} 
          ${item.color ? `Color: ${item.color}` : ''}
        </p>
        <p class="item-price">
          ${item.discount ? `<span class="original">₹${item.price}</span>` : ''}
          <span class="final">₹${discountedPrice}</span>
        </p>
      </div>

      <div class="item-quantity">
        <button onclick="updateQuantity('${item._id}', ${item.quantity - 1})">−</button>
        <input type="number" value="${item.quantity}" readonly>
        <button onclick="updateQuantity('${item._id}', ${item.quantity + 1})">+</button>
      </div>

      <div class="item-total">
        ₹${itemTotal}
      </div>

      <div class="item-actions">
        <button class="btn-remove" onclick="removeFromCart('${item._id}')" title="Remove item">
          ✕
        </button>
      </div>
    `;

    cartContainer.appendChild(cartItem);
  });
}

// Update cart item quantity
async function updateQuantity(itemId, newQuantity) {
  if (newQuantity < 1) {
    removeFromCart(itemId);
    return;
  }

  try {
    const response = await Cart.update(itemId, newQuantity);
    
    if (response.success) {
      loadCart();
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification('Failed to update cart', 'error');
  }
}

// Remove item from cart
async function removeFromCart(itemId) {
  try {
    const response = await Cart.remove(itemId);
    
    if (response.success) {
      showNotification('Item removed from cart', 'success');
      loadCart();
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification('Failed to remove item', 'error');
  }
}

// Clear entire cart
async function clearCart() {
  if (!confirm('Are you sure you want to clear your cart?')) return;

  try {
    const response = await Cart.clear();
    
    if (response.success) {
      loadCart();
      showNotification('Cart cleared', 'success');
    }
  } catch (error) {
    showNotification('Failed to clear cart', 'error');
  }
}

// Calculate and display cart totals
function calculateCartTotals(cart) {
  const subtotal = cart.subtotal || 0;
  const shippingCost = subtotal > 500 ? 0 : 149;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shippingCost + tax;

  const totalsContainer = document.getElementById('cart-totals');
  
  if (totalsContainer) {
    totalsContainer.innerHTML = `
      <div class="totals-card">
        <h3>Order Summary</h3>
        
        <div class="total-row">
          <span>Subtotal</span>
          <span>₹${subtotal}</span>
        </div>

        <div class="total-row">
          <span>Shipping</span>
          <span>${shippingCost === 0 ? 'Free' : `₹${shippingCost}`}</span>
        </div>

        <div class="total-row">
          <span>Tax (5%)</span>
          <span>₹${tax}</span>
        </div>

        <div class="coupon-section">
          <input type="text" id="coupon-code" placeholder="Enter coupon code" maxlength="20">
          <button onclick="applyCoupon()">Apply</button>
        </div>

        <div class="total-row total">
          <span>Total</span>
          <span>₹${total}</span>
        </div>

        <button class="btn-primary btn-block" onclick="proceedToCheckout()" ${cart.items?.length === 0 ? 'disabled' : ''}>
          Proceed to Checkout
        </button>

        <a href="/collection.html" class="btn-secondary btn-block">
          Continue Shopping
        </a>
      </div>
    `;

    window.cartTotal = { subtotal, shippingCost, tax, total };
  }
}

// Apply coupon
async function applyCoupon() {
  const couponCode = document.getElementById('coupon-code').value;
  
  if (!couponCode) {
    showNotification('Please enter a coupon code', 'error');
    return;
  }

  // Validation will happen during order creation
  showNotification('Coupon will be applied at checkout', 'info');
}

// Proceed to checkout
function proceedToCheckout() {
  if (!isLoggedIn()) {
    window.location.href = '/login.html';
    return;
  }

  window.location.href = '/checkout.html';
}

// Initialize cart on page load
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('cart-items')) {
    requireAuth();
    loadCart();
  }
});