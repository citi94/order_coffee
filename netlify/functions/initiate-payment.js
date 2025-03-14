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

    // Create a payment link for the order
    const paymentLinkResponse = await fetch('https://purchase.izettle.com/purchases/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${access_token}`
      },
      body: JSON.stringify({
        purchaseUUID: orderId,
        amount: {
          amount: amount,
          currencyId: "GBP"
        },
        title: "Coffee Order",
        redirectUrl: `${process.env.SITE_URL}/confirmation?orderId=${orderId}`,
        reference: `order_${Date.now()}`
      })
    });

    const paymentData = await paymentLinkResponse.json();

    if (!paymentData.paymentUUID) {
      console.error('Payment link creation failed:', paymentData);
      throw new Error('Failed to create payment link');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        paymentId: paymentData.paymentUUID,
        paymentUrl: paymentData.paymentUrl
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