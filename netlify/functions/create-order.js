// netlify/functions/create-order.js
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

    // First let's try to figure out the right API endpoint
    console.log('Checking available Zettle API endpoints...');
    
    // Try to query the Zettle API for purchase endpoints
    const endpointInfoResponse = await fetch('https://purchase.izettle.com', {
      headers: {
        'Authorization': `Bearer ${access_token}`
      }
    });
    
    console.log('Endpoint info status:', endpointInfoResponse.status);
    try {
      const endpointInfo = await endpointInfoResponse.text();
      console.log('Available endpoints:', endpointInfo);
    } catch (error) {
      console.log('Could not get endpoint info:', error.message);
    }
    
    // Prepare order data - try a simpler format first
    const zettleOrder = {
      source: "ONLINE_ORDER",
      orderItems: orderData.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: {
          amount: item.unitPrice || item.price,
          currencyId: "GBP"
        },
        // Add options as comment if present
        comment: item.options ? 
          Object.entries(item.options)
            .filter(([key, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') : ''
      })),
      // Add metadata
      metadata: {
        customerName: orderData.customerName || '',
        customerEmail: orderData.customerEmail || '',
        orderComment: orderData.comment || ''
      }
    };
    
    console.log('Formatted Zettle order data:', JSON.stringify(zettleOrder, null, 2));

    // Try multiple endpoints to determine which one works
    const endpoints = [
      'https://purchase.izettle.com/purchases/v2',
      'https://purchase.izettle.com/purchases/v2/orders',
      'https://purchase.izettle.com/v2/orders',
      'https://order.izettle.com/organizations/self/orders'
    ];
    
    let orderResult = null;
    let successEndpoint = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const orderResponse = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(zettleOrder)
        });
        
        console.log(`${endpoint} status:`, orderResponse.status);
        
        // If succeeded or provided useful error info
        if (orderResponse.status !== 404) {
          const responseText = await orderResponse.text();
          console.log(`${endpoint} response:`, responseText);
          
          try {
            const result = JSON.parse(responseText);
            if (orderResponse.status === 200 || orderResponse.status === 201) {
              orderResult = result;
              successEndpoint = endpoint;
              break;
            }
          } catch (error) {
            console.log('Failed to parse response:', error.message);
          }
        }
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
      }
    }
    
    if (!orderResult) {
      throw new Error('Failed to create order: Could not find a working API endpoint');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        orderId: orderResult.uuid || orderResult.orderId || orderResult.purchaseUUID || `order-${Date.now()}`,
        orderNumber: orderResult.orderNumber || Date.now().toString().slice(-6),
        endpoint: successEndpoint
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