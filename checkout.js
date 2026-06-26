// checkout.js - Checkout and Order Management

// Load checkout page
async function loadCheckout() {
  requireAuth();

  try {
    const userResponse = await User.getProfile();
    const cartResponse = await Cart.get();

    if (userResponse.success && cartResponse.success) {
      displayCheckoutForm(userResponse.data, cartResponse.data);
    }
  } catch (error) {
    showNotification('Failed to load checkout', 'error');
    console.error('Error:', error);
  }
}

// Display checkout form
function displayCheckoutForm(user, cart) {
  const checkoutContainer = document.getElementById('checkout-container');
  
  if (!checkoutContainer) return;

  const subtotal = cart.subtotal || 0;
  const shippingCost = subtotal > 500 ? 0 : 149;
  const tax = Math.round(subtotal * 0.05);
  const total = subtotal + shippingCost + tax;

  checkoutContainer.innerHTML = `
    <div class="checkout-wrapper">
      <div class="checkout-left">
        <form id="checkout-form" onsubmit="submitCheckout(event)">
          <h2>Shipping Address</h2>
          
          <div class="form-group">
            <label>Full Name *</label>
            <input type="text" name="name" value="${user.name}" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Phone *</label>
              <input type="tel" name="phone" value="${user.phone}" required>
            </div>
            <div class="form-group">
              <label>Email *</label>
              <input type="email" name="email" value="${user.email}" readonly>
            </div>
          </div>

          <div class="form-group">
            <label>Street Address *</label>
            <input type="text" name="street" value="${user.address?.street || ''}" required>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>City *</label>
              <input type="text" name="city" value="${user.address?.city || ''}" required>
            </div>
            <div class="form-group">
              <label>State *</label>
              <input type="text" name="state" value="${user.address?.state || ''}" required>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group">
              <label>Pincode *</label>
              <input type="text" name="pincode" value="${user.address?.pincode || ''}" required>
            </div>
            <div class="form-group">
              <label>Country *</label>
              <input type="text" name="country" value="${user.address?.country || 'India'}" required>
            </div>
          </div>

          <h2>Payment Method</h2>

          <div class="payment-options">
            <label class="payment-option">
              <input type="radio" name="paymentMethod" value="COD" checked>
              <span class="payment-label">
                <strong>Cash on Delivery (COD)</strong>
                <small>Pay when you receive your order</small>
              </span>
            </label>

            <label class="payment-option">
              <input type="radio" name="paymentMethod" value="UPI">
              <span class="payment-label">
                <strong>UPI Payment</strong>
                <small>Google Pay, PhonePe, WhatsApp Pay</small>
              </span>
            </label>
          </div>

          <div class="form-group">
            <label>
              <input type="checkbox" name="terms" required>
              I agree to the terms and conditions
            </label>
          </div>

          <button type="submit" class="btn-primary btn-large">
            Place Order
          </button>
        </form>
      </div>

      <div class="checkout-right">
        <div class="order-summary">
          <h2>Order Summary</h2>

          <div class="summary-items">
            ${cart.items.map(item => {
              const discountedPrice = item.discount 
                ? Math.round(item.price * (1 - item.discount / 100))
                : item.price;
              return `
                <div class="summary-item">
                  <img src="${item.product.images[0]}" alt="${item.product.name}">
                  <div class="summary-item-info">
                    <h4>${item.product.name}</h4>
                    <p>Qty: ${item.quantity}</p>
                  </div>
                  <div class="summary-item-price">
                    ₹${discountedPrice * item.quantity}
                  </div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="summary-totals">
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
            <div class="total-row total">
              <span>Total Amount</span>
              <span>₹${total}</span>
            </div>
          </div>

          <div class="trust-badges">
            <span>✓ Secure Checkout</span>
            <span>✓ Easy Returns</span>
            <span>✓ Fast Delivery</span>
          </div>
        </div>
      </div>
    </div>
  `;

  window.checkoutData = {
    subtotal,
    shippingCost,
    tax,
    total,
    cartItems: cart.items
  };
}

// Submit checkout form
async function submitCheckout(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  const shippingAddress = {
    name: formData.get('name'),
    street: formData.get('street'),
    city: formData.get('city'),
    state: formData.get('state'),
    pincode: formData.get('pincode'),
    country: formData.get('country'),
    phone: formData.get('phone')
  };

  const paymentMethod = formData.get('paymentMethod');
  const couponCode = sessionStorage.getItem('couponCode') || '';

  try {
    // Create order
    const response = await Orders.create(shippingAddress, paymentMethod, couponCode);

    if (response.success) {
      const order = response.data;
      sessionStorage.setItem('currentOrder', JSON.stringify(order));

      // Process payment based on method
      if (paymentMethod === 'UPI') {
        window.location.href = `/payment.html?orderId=${order._id}&method=upi`;
      } else if (paymentMethod === 'COD') {
        // Process COD
        await Payment.processCOD(order._id);
        window.location.href = `/order-confirmation.html?orderId=${order._id}`;
      }
    } else {
      showNotification(response.message, 'error');
    }
  } catch (error) {
    showNotification('Failed to create order: ' + error.message, 'error');
    console.error('Error:', error);
  }
}

// Load order confirmation
async function loadOrderConfirmation() {
  const orderId = new URLSearchParams(window.location.search).get('orderId');
  
  if (!orderId) {
    window.location.href = '/index.html';
    return;
  }

  try {
    const response = await Orders.getById(orderId);

    if (response.success) {
      displayOrderConfirmation(response.data);
    }
  } catch (error) {
    showNotification('Failed to load order details', 'error');
  }
}

// Display order confirmation
function displayOrderConfirmation(order) {
  const container = document.getElementById('confirmation-container');
  
  if (!container) return;

  container.innerHTML = `
    <div class="confirmation-content">
      <div class="confirmation-header">
        <div class="success-icon">✓</div>
        <h1>Order Confirmed!</h1>
        <p>Thank you for your purchase</p>
      </div>

      <div class="order-details">
        <div class="detail-card">
          <h3>Order Number</h3>
          <p class="order-number">${order.orderNumber}</p>
        </div>

        <div class="detail-card">
          <h3>Delivery Address</h3>
          <p>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state}<br>
            ${order.shippingAddress.pincode}
          </p>
        </div>

        <div class="detail-card">
          <h3>Payment Method</h3>
          <p>${order.paymentMethod}</p>
          <p class="payment-status">Status: <strong>${order.paymentStatus}</strong></p>
        </div>

        <div class="detail-card">
          <h3>Total Amount</h3>
          <p class="total-amount">₹${order.totalAmount}</p>
        </div>
      </div>

      <div class="order-items">
        <h3>Items in Your Order</h3>
        ${order.products.map(item => `
          <div class="order-item">
            <div class="item-info">
              <h4>${item.product.name}</h4>
              <p>Quantity: ${item.quantity}</p>
            </div>
            <div class="item-price">₹${item.price * item.quantity}</div>
          </div>
        `).join('')}
      </div>

      <div class="next-steps">
        <h3>What's Next?</h3>
        <ol>
          <li>You'll receive an order confirmation email shortly</li>
          <li>Your order will be dispatched within 24 hours</li>
          <li>Track your order status anytime</li>
          <li>Enjoy your CampusKudi items!</li>
        </ol>
      </div>

      <div class="action-buttons">
        <a href="/order-tracking.html?orderId=${order._id}" class="btn-primary">
          Track Order
        </a>
        <a href="/collection.html" class="btn-secondary">
          Continue Shopping
        </a>
      </div>
    </div>
  `;
}

// Load order tracking
async function loadOrderTracking() {
  const orderId = new URLSearchParams(window.location.search).get('orderId');
  
  if (!orderId) {
    window.location.href = '/my-orders.html';
    return;
  }

  try {
    const response = await Orders.track(orderId);

    if (response.success) {
      displayOrderTracking(response.data);
    }
  } catch (error) {
    showNotification('Failed to load order', 'error');
  }
}

// Display order tracking
function displayOrderTracking(order) {
  const container = document.getElementById('tracking-container');
  
  if (!container) return;

  const statuses = ['Pending', 'Processing', 'Shipped', 'Out for Delivery', 'Delivered'];
  const currentStatusIndex = statuses.indexOf(order.orderStatus);

  container.innerHTML = `
    <div class="tracking-content">
      <div class="tracking-header">
        <h2>Order ${order.orderNumber}</h2>
        <p>Status: <strong>${order.orderStatus}</strong></p>
      </div>

      <div class="tracking-timeline">
        ${statuses.map((status, index) => `
          <div class="timeline-item ${index <= currentStatusIndex ? 'completed' : ''}">
            <div class="timeline-dot"></div>
            <div class="timeline-label">
              <h4>${status}</h4>
            </div>
          </div>
        `).join('')}
      </div>

      <div class="tracking-details">
        <h3>Delivery Details</h3>
        
        <div class="detail-box">
          <label>Shipping Address</label>
          <p>
            ${order.shippingAddress.name}<br>
            ${order.shippingAddress.street}<br>
            ${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}
          </p>
        </div>

        ${order.trackingNumber ? `
          <div class="detail-box">
            <label>Tracking Number</label>
            <p>${order.trackingNumber}</p>
          </div>
        ` : ''}

        <div class="detail-box">
          <label>Order Date</label>
          <p>${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        <div class="detail-box">
          <label>Total Amount</label>
          <p class="amount">₹${order.totalAmount}</p>
        </div>
      </div>

      <div class="order-items-list">
        <h3>Items</h3>
        ${order.products.map(item => `
          <div class="list-item">
            <span>${item.product.name}</span>
            <span>Qty: ${item.quantity}</span>
            <span>₹${item.price * item.quantity}</span>
          </div>
        `).join('')}
      </div>

      <div class="support-section">
        <h3>Need Help?</h3>
        <p>Contact our customer support team</p>
        <a href="mailto:support@campuskudi.com" class="btn-secondary">Email Support</a>
      </div>
    </div>
  `;
}

// Initialize checkout pages
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('checkout-container')) {
    loadCheckout();
  } else if (document.getElementById('confirmation-container')) {
    loadOrderConfirmation();
  } else if (document.getElementById('tracking-container')) {
    loadOrderTracking();
  }
});