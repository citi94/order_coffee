// In netlify/functions/create-order.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ status: 'error', message: 'Method not allowed' })
    };
  }

  try {
    console.log('===== CREATE ORDER FUNCTION =====');
    const orderData = JSON.parse(event.body);
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Get access token
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

    // Simplify the order data for Zettle API
    // This is a key change - we're formatting the data exactly as Zettle expects
    const zettleOrder = {
      purchaseUUID: `order-${Date.now()}`, // Generate a unique order ID
      clientUUID: `client-${Date.now()}`, // Generate a unique client ID
      source: "ONLINE_ORDER",
      products: orderData.items.map(item => ({
        productUuid: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: {
          amount: item.unitPrice || item.price, // Ensure we have a price
          currencyId: "GBP"
        },
        comment: item.options ? 
          Object.entries(item.options)
            .filter(([key, value]) => value) // Filter out empty options
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') : ''
      })),
      metadata: {
        customerName: orderData.customerName || '',
        customerEmail: orderData.customerEmail || '',
        orderComment: orderData.comment || ''
      }
    };
    
    console.log('Formatted Zettle order data:', JSON.stringify(zettleOrder, null, 2));

    // Create order in Zettle
    console.log('Sending order to Zettle API...');
    const orderResponse = await fetch(
      'https://purchase.izettle.com/purchases/v2',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(zettleOrder)
      }
    );
    
    console.log('Zettle API response status:', orderResponse.status);
    
    // Get full response text for debugging
    const responseText = await orderResponse.text();
    console.log('Zettle API response:', responseText);
    
    let orderResult;
    try {
      orderResult = JSON.parse(responseText);
    } catch (error) {
      console.error('Failed to parse order response:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to parse response from Zettle',
          responseText: responseText
        })
      };
    }

    if (!orderResult.purchaseUUID) {
      console.error('Order creation failed:', JSON.stringify(orderResult));
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to create order in Zettle',
          details: orderResult
        })
      };
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
        message: error.message,
        stack: error.stack
      })
    };
  }
};