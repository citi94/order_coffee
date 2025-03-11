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
    // Get access token - using the same method as your working display app
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

    // In a real implementation, you would check the payment status with Zettle
    // or in your own database where you're tracking payments
    
    // For this demonstration, we'll simulate a successful payment
    // In a real app, you would verify with the payment provider

    // Simulate a successful payment
    const simulatedOrderId = `order_${paymentId.substr(4, 8)}`;
    const simulatedOrderNumber = Math.floor(Math.random() * 1000).toString().padStart(3, '0');

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'COMPLETED', // or 'PENDING', 'FAILED'
        orderId: simulatedOrderId,
        orderNumber: simulatedOrderNumber
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