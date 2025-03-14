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

    // Create a uniqueId for this purchase
    const purchaseUUID = `order-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Prepare order data - format for the Zettle Purchase API
    const zettleOrder = {
      purchaseUUID: purchaseUUID,
      source: "ONLINE_ORDER",
      products: orderData.items.map(item => ({
        productUuid: item.id || "test-product-id", // Fallback to test product
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
        orderComment: orderData.comment || '',
        isTestOrder: 'true'
      }
    };
    
    console.log('Formatted Zettle order data:', JSON.stringify(zettleOrder, null, 2));

    // Create the order in Zettle
    const orderResponse = await fetch('https://purchase.izettle.com/purchases/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(zettleOrder)
    });
    
    console.log(`Order creation status: ${orderResponse.status}`);
    
    let responseData;
    try {
      const responseText = await orderResponse.text();
      console.log(`Order creation response: ${responseText}`);
      
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        // If not valid JSON, use the text
        responseData = { text: responseText };
      }
    } catch (e) {
      console.log('Failed to read response:', e.message);
    }
    
    if (orderResponse.status !== 200 && orderResponse.status !== 201) {
      throw new Error(`Failed to create order: ${JSON.stringify(responseData || {})}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        orderId: purchaseUUID,
        orderNumber: `TEST-${Date.now().toString().slice(-6)}`,
        isTestOrder: true
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