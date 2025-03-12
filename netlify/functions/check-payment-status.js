const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  const paymentId = event.queryStringParameters.paymentId;
  
  if (!paymentId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        status: 'error', 
        message: 'Payment ID is required' 
      })
    };
  }

  try {
    // Get access token
    const tokenResponse = await fetch('https://oauth.zettle.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'client_id': process.env.ZETTLE_CLIENT_ID,
        'assertion': process.env.ZETTLE_CLIENT_SECRET
      }).toString()
    });

    const tokenData = await tokenResponse.json();
    const access_token = tokenData.access_token;

    if (!access_token) {
      console.error('Token response:', tokenData);
      throw new Error('Failed to obtain access token');
    }

    // Check payment status
    const paymentResponse = await fetch(`https://purchase.izettle.com/purchases/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const paymentData = await paymentResponse.json();

    // Extract the order details from the payment
    const paymentStatus = paymentData.status || 'PENDING';
    const orderId = paymentData.purchaseUUID;
    
    // Get order details if payment is successful
    let orderDetails = {};
    if (paymentStatus === 'PAID' && orderId) {
      const orderResponse = await fetch(`https://purchase.izettle.com/purchases/v2/${orderId}`, {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      });
      const orderData = await orderResponse.json();
      orderDetails = {
        orderId: orderData.purchaseUUID,
        orderNumber: orderData.purchaseNumber || 'N/A'
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: paymentStatus === 'PAID' ? 'COMPLETED' : 
                paymentStatus === 'FAILED' ? 'FAILED' : 'PENDING',
        orderId: orderDetails.orderId || orderId,
        orderNumber: orderDetails.orderNumber || `${Date.now().toString().slice(-6)}`
      })
    };
  } catch (error) {
    console.error('Error checking payment status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};