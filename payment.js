// payment.js - Payment Processing

// Load payment page
async function loadPaymentPage() {
  const orderId = new URLSearchParams(window.location.search).get('orderId');
  const method = new URLSearchParams(window.location.search).get('method');

  if (!orderId) {
    window.location.href = '/checkout.html';
    return;
  }

  if (method === 'upi') {
    await generateUPIQR(orderId);
  } else {
    window.location.href = '/order-confirmation.html?orderId=' + orderId;
  }
}

// Generate UPI QR Code
async function generateUPIQR(orderId) {
  try {
    const response = await Payment.generateUPIQR(orderId);

    if (response.success) {
      displayUPIPayment(response.data);
    } else {
      showNotification(response.message, 'error');
      setTimeout(() => window.location.href = `/checkout.html`, 2000);
    }
  } catch (error) {
    showNotification('Failed to generate QR code', 'error');
    console.error('Error:', error);
    setTimeout(() => window.location.href = `/checkout.html`, 2000);
  }
}

// Display UPI payment page
function displayUPIPayment(paymentData) {
  const container = document.getElementById('payment-container');
  
  if (!container) return;

  container.innerHTML = `
    <div class="payment-wrapper">
      <div class="payment-card">
        <h1>Complete Your Payment</h1>
        <p>Scan the QR code or use your UPI app to pay</p>

        <div class="payment-details">
          <div class="detail">
            <label>Order ID</label>
            <p>${paymentData.orderId}</p>
          </div>
          
          <div class="detail">
            <label>Amount to Pay</label>
            <p class="amount">₹${paymentData.amount}</p>
          </div>

          <div class="detail">
            <label>Merchant</label>
            <p>${paymentData.merchantName}</p>
          </div>
        </div>

        <div class="upi-qr">
          <h3>Scan to Pay</h3>
          <img id="qr-code" src="${paymentData.qrCode}" alt="UPI QR Code">
          <p class="qr-instruction">Use Google Pay, PhonePe, WhatsApp Pay, or your bank app</p>
        </div>

        <div class="upi-string">
          <h3>Pay Manually</h3>
          <p>Copy this UPI ID:</p>
          <div class="copy-box">
            <input type="text" readonly value="${paymentData.upiId}" id="upi-id">
            <button onclick="copyToClipboard('upi-id')" class="btn-secondary">Copy</button>
          </div>
        </div>

        <div class="payment-instructions">
          <h3>How to Pay</h3>
          <ol>
            <li>Open your UPI payment app</li>
            <li>Scan the QR code above OR enter the UPI ID manually</li>
            <li>Enter the amount (₹${paymentData.amount})</li>
            <li>Complete the payment</li>
            <li>Return here to confirm payment</li>
          </ol>
        </div>

        <div class="verification-section">
          <h3>Payment Verification</h3>
          <p>Have you completed the payment?</p>
          
          <div class="verification-form">
            <input type="text" id="transaction-id" placeholder="Enter Transaction ID" maxlength="20">
            <button onclick="verifyPayment('${paymentData.orderId}')" class="btn-primary">
              Verify Payment
            </button>
          </div>

          <div class="auto-verify">
            <p>Or we'll automatically check your payment...</p>
            <button onclick="autoCheckPayment('${paymentData.orderId}')" class="btn-secondary">
              Check Payment Status
            </button>
          </div>
        </div>

        <div class="payment-help">
          <h3>Payment Not Working?</h3>
          <ul>
            <li>Ensure you have sufficient balance</li>
            <li>Check your internet connection</li>
            <li>Try with a different UPI app</li>
            <li>Contact your bank if you face issues</li>
          </ul>
          <p>Need help? <a href="mailto:support@campuskudi.com">Contact Support</a></p>
        </div>
      </div>
    </div>
  `;

  window.currentOrderId = paymentData.orderId;
}

// Verify payment
async function verifyPayment(orderId) {
  const transactionId = document.getElementById('transaction-id').value;

  if (!transactionId) {
    showNotification('Please enter transaction ID', 'error');
    return;
  }

  try {
    const response = await Payment.verifyUPI(orderId, transactionId);

    if (response.success) {
      showNotification('Payment verified successfully!', 'success');
      setTimeout(() => {
        window.location.href = `/order-confirmation.html?orderId=${orderId}`;
      }, 2000);
    } else {
      showNotification('Payment verification failed. Please check transaction ID.', 'error');
    }
  } catch (error) {
    showNotification('Verification error: ' + error.message, 'error');
  }
}

// Auto-check payment status
async function autoCheckPayment(orderId) {
  try {
    const response = await Payment.getPaymentStatus(orderId);

    if (response.success && response.data.paymentStatus === 'Paid') {
      showNotification('Payment confirmed!', 'success');
      setTimeout(() => {
        window.location.href = `/order-confirmation.html?orderId=${orderId}`;
      }, 2000);
    } else if (response.success && response.data.paymentStatus === 'Pending') {
      showNotification('Payment still pending. Please complete your payment.', 'info');
    } else {
      showNotification('Payment verification failed', 'error');
    }
  } catch (error) {
    showNotification('Error checking payment status', 'error');
  }
}

// Copy to clipboard
function copyToClipboard(elementId) {
  const element = document.getElementById(elementId);
  element.select();
  document.execCommand('copy');
  showNotification('Copied to clipboard!', 'success');
}

// Initialize payment page
document.addEventListener('DOMContentLoaded', () => {
  if (document.getElementById('payment-container')) {
    loadPaymentPage();
  }
});