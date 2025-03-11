const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
  }

  try {
    const { orderId, amount } = JSON.parse(event.body);
    
    if (!orderId || !amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          status: 'error', 
          message: 'Order ID and amount are required' 
        })
      };
    }

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

    // Note: In a production implementation, you would integrate with the Zettle Payment API
    // to handle Apple Pay / Google Pay. For this demonstration, we'll simulate the payment process.
    
    // For a real implementation, you would:
    // 1. Create a payment session with Zettle
    // 2. Return the session details to initialize Apple Pay / Google Pay
    // 3. Handle the payment completion

    // Simulate payment creation
    const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // In a real implementation, you would store this payment in a database
    // along with its status and the order ID

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        paymentId,
        // In a real implementation, this might be a URL to redirect to for payment
        // or details to initialize a payment sheet in the browser
        paymentUrl: null
      })
    };
  } catch (error) {
    console.error('Error initiating payment:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};