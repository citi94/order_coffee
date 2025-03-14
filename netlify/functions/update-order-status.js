// netlify/functions/update-order-status.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
  }

  try {
    const { orderId, paymentId, status } = JSON.parse(event.body);
    
    if (!orderId || !paymentId || !status) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Order ID, payment ID, and status are required' 
        })
      };
    }

    // Get access token from Zettle
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

    // Verify payment with Zettle API
    const paymentResponse = await fetch(`https://purchase.izettle.com/purchases/v2/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });

    const paymentData = await paymentResponse.json();
    
    // If payment status is confirmed, update the order
    if (paymentData.status === 'PAID') {
      // Update order status in Zettle (if needed)
      // This part depends on Zettle's API for updating orders
      
      // For purposes of this example, we'll just return success
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'success',
          message: 'Order status updated successfully',
          orderId: orderId,
          paymentId: paymentId,
          paymentStatus: paymentData.status
        })
      };
    } else {
      // Payment not confirmed
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'error',
          message: 'Payment not confirmed',
          paymentStatus: paymentData.status
        })
      };
    }
  } catch (error) {
    console.error('Error updating order status:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};