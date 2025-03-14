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
    const orderData = JSON.parse(event.body);
    console.log('Received order data:', JSON.stringify(orderData, null, 2));
    
    // Mark this as a test order for demonstration purposes
    const isTestOrder = orderData.isTestOrder || true; // Default to test mode for now
    
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
      console.error('Token response:', JSON.stringify(tokenData));
      throw new Error('Failed to obtain access token');
    }
    
    // Create a uniqueId for this purchase
    const purchaseUUID = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Format for Zettle purchase API
    const zettleOrder = {
      purchaseUUID: purchaseUUID,
      source: "ONLINE_ORDER", // Identify this as coming from your web app
      products: orderData.items.map(item => ({
        productUuid: item.id || "test-product-id", // Fallback to test product if no ID
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
        customerName: orderData.customerName || 'Test Customer',
        customerEmail: orderData.customerEmail || '',
        orderComment: orderData.comment || '',
        isTestOrder: isTestOrder.toString()
      }
    };
    
    console.log('Sending order to Zettle:', JSON.stringify(zettleOrder, null, 2));
    
    // Create the order in Zettle
    const orderResponse = await fetch('https://purchase.izettle.com/purchases/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(zettleOrder)
    });
    
    const responseStatus = orderResponse.status;
    let responseData;
    
    try {
      const responseText = await orderResponse.text();
      console.log(`Order creation response (${responseStatus}):`, responseText);
      responseData = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing response:', error);
      throw new Error('Failed to parse response from Zettle');
    }
    
    if (responseStatus !== 200 && responseStatus !== 201) {
      throw new Error(`Failed to create order: ${JSON.stringify(responseData)}`);
    }
    
    // Return success with order details
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        orderId: purchaseUUID,
        orderNumber: `COFFEE-${Date.now().toString().slice(-6)}`,
        isTestOrder: isTestOrder
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