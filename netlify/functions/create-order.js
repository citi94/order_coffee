const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
  }

  try {
    const orderData = JSON.parse(event.body);
    
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

    // Format the order for Zettle
    const zettleOrder = {
      purchaseDate: new Date().toISOString(),
      source: "ONLINE_ORDER",
      products: orderData.items.map(item => ({
        productUuid: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: {
          amount: item.unitPrice,
          currencyId: "GBP"
        },
        // Add any variant or option details
        comment: Object.entries(item.options)
          .map(([key, value]) => `${key}: ${value}`)
          .join(', ')
      })),
      // Add customer information if available
      metadata: {
        customerName: orderData.customerName || '',
        customerEmail: orderData.customerEmail || '',
        orderComment: orderData.comment || ''
      }
    };

    // Create order in Zettle
    const orderResponse = await fetch(
      'https://purchase.izettle.com/purchases/v2/direct',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(zettleOrder)
      }
    );

    const orderResult = await orderResponse.json();

    if (!orderResult.purchaseUUID) {
      console.error('Order creation failed:', orderResult);
      throw new Error('Failed to create order in Zettle');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        orderId: orderResult.purchaseUUID,
        orderNumber: orderResult.purchaseNumber || Date.now().toString().slice(-6)
      })
    };
  } catch (error) {
    console.error('Error creating order:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};