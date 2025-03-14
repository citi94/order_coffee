// netlify/functions/create-payment-session.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
  }

  try {
    console.log('===== CREATE PAYMENT SESSION =====');
    const orderData = JSON.parse(event.body);
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Get access token using JWT Bearer method
    console.log('Getting Zettle access token...');
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
      console.error('Token response:', JSON.stringify(tokenData));
      throw new Error('Failed to obtain access token');
    }
    
    console.log('Successfully obtained access token');

    // Create a payment session with Zettle
    // This uses the /payments endpoint for creating payment links
    const paymentData = {
      amount: {
        amount: orderData.totalAmount,
        currencyId: "GBP"
      },
      title: "Coffee Order",
      reference: `coffee-order-${Date.now()}`,
      redirectUrl: `${process.env.SITE_URL}/confirmation?orderId=${orderId}`,
      metadata: {
        customerName: orderData.customerName || '',
        customerEmail: orderData.customerEmail || '',
        orderComment: orderData.comment || '',
        itemCount: orderData.items.length
      }
    };

    console.log('Creating payment session with data:', JSON.stringify(paymentData, null, 2));
    
    const paymentResponse = await fetch('https://purchase.izettle.com/purchases/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentData)
    });
    
    console.log('Payment session creation status:', paymentResponse.status);
    
    const responseText = await paymentResponse.text();
    console.log('Payment session creation response:', responseText);
    
    let paymentResult;
    try {
      paymentResult = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse payment session response:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to parse response from Zettle',
          responseText: responseText
        })
      };
    }

    if (!paymentResult.paymentUUID || !paymentResult.paymentUrl) {
      console.error('Payment session creation failed:', JSON.stringify(paymentResult));
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to create payment session',
          details: paymentResult
        })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        paymentId: paymentResult.paymentUUID,
        paymentUrl: paymentResult.paymentUrl,
        // Include Apple Pay session data if available
        applePaySession: paymentResult.applePaySession || null
      })
    };
  } catch (error) {
    console.error('Error creating payment session:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message,
        stack: error.stack
      })
    };
  }
};