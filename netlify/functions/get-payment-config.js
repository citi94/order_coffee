// netlify/functions/get-payment-config.js
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
    
    // Get payment configuration
    const paymentConfigResponse = await fetch('https://payment.izettle.com/configuration', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    const paymentConfig = await paymentConfigResponse.json();
    
    if (!paymentConfig || !paymentConfig.publicKey) {
      throw new Error('Invalid payment configuration received from Zettle');
    }
    
    // Get available payment methods and features
    const featureFlags = {
      allowApplePay: true,
      allowCardPayment: true,
      showSaveCardOption: false,
      allowInstallments: false,
    };
    
    // Return configuration needed for client-side
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        publicKey: paymentConfig.publicKey,
        paymentConfig: {
          amount: amount,
          currency: 'GBP',
          reference: `order-${orderId}`,
          merchantName: 'Middle Street Coffee',
          returnUrl: `${process.env.URL}/confirmation?orderId=${orderId}`,
          cancelUrl: `${process.env.URL}/checkout`,
          features: featureFlags,
          styles: {
            base: {
              backgroundColor: 'white',
              color: 'black',
              fontSize: '16px',
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
              placeholderColor: '#BDBDBD'
            },
            invalid: {
              color: '#E53935'
            }
          }
        }
      })
    };
  } catch (error) {
    console.error('Error getting payment configuration:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};