// netlify/functions/test-order-creation.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Get access token using JWT Bearer method
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
          message: 'Failed to obtain access token',
          details: tokenData
        })
      };
    }

    // Test multiple order formats and endpoints
    const testCases = [
      {
        name: "Format 1: purchaseUUID and products",
        endpoint: "https://purchase.izettle.com/purchases/v2",
        payload: {
          purchaseUUID: `order-${Date.now()}`,
          clientUUID: `client-${Date.now()}`,
          source: "ONLINE_ORDER",
          products: [
            {
              productUuid: "test-product",
              name: "Test Coffee",
              quantity: 1,
              unitPrice: {
                amount: 300,
                currencyId: "GBP"
              }
            }
          ]
        }
      },
      {
        name: "Format 2: orderItems format",
        endpoint: "https://purchase.izettle.com/purchases/v2",
        payload: {
          source: "ONLINE_ORDER",
          orderItems: [
            {
              name: "Test Coffee",
              quantity: 1,
              unitPrice: {
                amount: 300,
                currencyId: "GBP"
              }
            }
          ]
        }
      },
      {
        name: "Format 3: Orders endpoint with UUID",
        endpoint: "https://purchase.izettle.com/purchases/v2/orders",
        payload: {
          uuid: `order-${Date.now()}`,
          orderItems: [
            {
              name: "Test Coffee",
              quantity: 1,
              unitPrice: {
                amount: 300,
                currencyId: "GBP"
              }
            }
          ]
        }
      },
      {
        name: "Format 4: Order API endpoint",
        endpoint: "https://order.izettle.com/organizations/self/orders",
        payload: {
          orderItems: [
            {
              name: "Test Coffee",
              quantity: 1,
              price: {
                amount: 300,
                currencyId: "GBP"
              }
            }
          ],
          orderNumber: `TEST-${Date.now().toString().slice(-6)}`
        }
      }
    ];
    
    const results = {};
    
    for (const testCase of testCases) {
      try {
        console.log(`Testing ${testCase.name}...`);
        
        const response = await fetch(testCase.endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testCase.payload)
        });
        
        const status = response.status;
        console.log(`${testCase.name} status: ${status}`);
        
        let responseData;
        try {
          const responseText = await response.text();
          console.log(`${testCase.name} response: ${responseText}`);
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            responseData = responseText.substring(0, 500);
          }
        } catch (e) {
          responseData = `Error reading response: ${e.message}`;
        }
        
        results[testCase.name] = {
          status,
          success: status === 200 || status === 201,
          responseData
        };
      } catch (error) {
        console.error(`Error with ${testCase.name}:`, error);
        results[testCase.name] = {
          error: error.message
        };
      }
    }
    
    // Analyze what worked and what didn't
    const successCases = Object.entries(results)
      .filter(([_, data]) => data.success)
      .map(([name, _]) => name);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: successCases.length > 0 ? 'success' : 'failed',
        message: successCases.length > 0 
          ? `Successfully found ${successCases.length} working order creation formats` 
          : 'No successful order creation methods found',
        successfulFormats: successCases,
        results
      })
    };
  } catch (error) {
    console.error('Test order creation error:', error);
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