// src/pages/OrderConfirmation.js - update useEffect to check for orderId in URL query params
useEffect(() => {
  // First, try to get order details from URL parameters (from payment redirect)
  const params = new URLSearchParams(location.search);
  const orderId = params.get('orderId');
  
  if (orderId) {
    // Get order details from localStorage
    const pendingOrder = localStorage.getItem('pendingOrder');
    if (pendingOrder) {
      const orderData = JSON.parse(pendingOrder);
      setOrderDetails({
        orderId: orderId,
        orderNumber: orderId.slice(-6),
        pickupTime: orderData.pickupTime,
        customerName: orderData.customerName
      });
      setStatus('success');
      // Clear the pending order from localStorage
      localStorage.removeItem('pendingOrder');
      return;
    }
  }
  
  // If we have order details from navigation state, use those
  if (location.state?.orderId) {
    setOrderDetails({
      orderId: location.state.orderId,
      orderNumber: location.state.orderNumber,
      pickupTime: location.state.pickupTime,
      customerName: location.state.customerName
    });
    setStatus('success');
  } else {
    // Otherwise check for payment ID in localStorage
    const paymentId = localStorage.getItem('currentPaymentId');
    
    if (!paymentId) {
      // No payment in progress, redirect to home
      navigate('/');
      return;
    }
    
    // Rest of your existing code for checking payment status...
  }
}, [location.search, location.state, navigate]);