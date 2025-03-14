// netlify/functions/analyze-order-error.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Get sample order data from query param or use default
    let sampleOrder;
    
    if (event.queryStringParameters && event.queryStringParameters.data) {
      try {
        sampleOrder = JSON.parse(decodeURIComponent(event.queryStringParameters.data));
      } catch (e) {
        console.error('Error parsing order data:', e);
        sampleOrder = null;
      }
    }
    
    // Default test order if none provided
    if (!sampleOrder) {
      sampleOrder = {
        customerName: "Test Customer",
        customerEmail: "test@example.com",
        comment: "Pickup time: 14:30",
        items: [
          {
            id: "test-product-id",
            name: "Test Coffee",
            quantity: 1,
            unitPrice: 300,
            options: {
              milk: "Oat Milk"
            }
          }
        ],
        totalAmount: 300
      };
    }
    
    // Get Zettle access token
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
      return {
        statusCode: 401,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to obtain access token'
        })
      };
    }
    
    // Build a debugging payload using the original create-order.js code
    const originalFormat = {
      purchaseUUID: `order-${Date.now()}`,
      clientUUID: `client-${Date.now()}`,
      source: "ONLINE_ORDER",
      products: sampleOrder.items.map(item => ({
        productUuid: item.id,
        name: item.name,
        quantity: item.quantity,
        unitPrice: {
          amount: item.unitPrice || item.price,
          currencyId: "GBP"
        },
        comment: item.options ? 
          Object.entries(item.options)
            .filter(([key, value]) => value)
            .map(([key, value]) => `${key}: ${value}`)
            .join(', ') : ''
      })),
      metadata: {
        customerName: sampleOrder.customerName || '',
        customerEmail: sampleOrder.customerEmail || '',
        orderComment: sampleOrder.comment || ''
      }
    };
    
    // Send the actual request to Zettle
    const orderResponse = await fetch('https://purchase.izettle.com/purchases/v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(originalFormat)
    });
    
    // Get response details
    const status = orderResponse.status;
    const statusText = orderResponse.statusText;
    const headers = {};
    
    // Get headers
    orderResponse.headers.forEach((value, name) => {
      headers[name] = value;
    });
    
    // Try to get response text
    let responseData = null;
    try {
      const responseText = await orderResponse.text();
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        responseData = responseText;
      }
    } catch (e) {
      responseData = `Error reading response: ${e.message}`;
    }
    
    // Check Zettle API documentation constraints
    const constraints = [
      {
        check: "UUID format",
        description: "Zettle might require UUIDs in a specific format (UUID v4)",
        result: originalFormat.purchaseUUID.includes('-') ? 
          "Warning: purchaseUUID might not be in proper UUID v4 format" : 
          "OK: Simple format used"
      },
      {
        check: "Product IDs",
        description: "Product IDs might need to exist in Zettle inventory",
        result: "Warning: Test product IDs might not exist in your Zettle account"
      },
      {
        check: "Valid source",
        description: "The 'source' field might need to be a specific value",
        result: "Using ONLINE_ORDER as source"
      },
      {
        check: "Required fields",
        description: "Zettle might require specific fields",
        result: originalFormat.products.length > 0 ? 
          "OK: Products are included" : 
          "Error: No products in order"
      }
    ];
    
    // Try to diagnose the issue
    let diagnosis = "Unknown error";
    if (status === 405) {
      diagnosis = "Method Not Allowed - the endpoint does not support POST or the URL is incorrect";
    } else if (status === 400) {
      diagnosis = "Bad Request - the order format doesn't match what Zettle expects";
    } else if (status === 401) {
      diagnosis = "Unauthorized - the access token might be invalid or expired";
    } else if (status === 403) {
      diagnosis = "Forbidden - your account might not have permission to create orders";
    } else if (status === 404) {
      diagnosis = "Not Found - the endpoint URL is incorrect";
    } else if (status === 500) {
      diagnosis = "Server Error - something went wrong on Zettle's side";
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'completed',
        originalOrderData: sampleOrder,
        formattedPayload: originalFormat,
        response: {
          status,
          statusText,
          headers,
          data: responseData
        },
        constraints,
        diagnosis,
        // Suggest next steps
        nextSteps: [
          "Review the detailed error message from Zettle",
          "Check if the format matches what's expected in Zettle documentation",
          "Try the test-order-creation function to test multiple formats",
          "Contact Zettle support if needed"
        ]
      })
    };
  } catch (error) {
    console.error('Error analyzing order:', error);
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