// netlify/functions/explore-zettle-api.js
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

    // List of Zettle API endpoints to explore
    const endpointsToTry = [
      // Base domains
      'https://purchase.izettle.com',
      'https://order.izettle.com',
      'https://secure.izettle.com',
      'https://products.izettle.com',
      
      // Purchase API endpoints
      'https://purchase.izettle.com/purchases/v2',
      'https://purchase.izettle.com/v2/purchases',
      'https://purchase.izettle.com/organizations/self/purchases',
      
      // Order API endpoints
      'https://purchase.izettle.com/purchases/v2/orders',
      'https://purchase.izettle.com/v2/orders',
      'https://order.izettle.com/organizations/self/orders',
      
      // Product API endpoints
      'https://products.izettle.com/organizations/self/products',
      'https://products.izettle.com/organizations/self/products/v2',
      
      // User/org info
      'https://secure.izettle.com/users/me',
      'https://secure.izettle.com/organizations/self'
    ];
    
    const results = {};
    
    // Test each endpoint
    for (const endpoint of endpointsToTry) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        
        const status = response.status;
        let data = 'No content';
        
        try {
          const responseText = await response.text();
          if (responseText && responseText.trim()) {
            try {
              // Try to parse as JSON
              const jsonData = JSON.parse(responseText);
              data = jsonData;
            } catch {
              // If not JSON, just use the raw text
              data = responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '');
            }
          }
        } catch (error) {
          data = `Error reading response: ${error.message}`;
        }
        
        results[endpoint] = {
          status,
          success: status >= 200 && status < 300,
          data
        };
      } catch (error) {
        results[endpoint] = {
          error: error.message
        };
      }
    }
    
    // Identify working endpoints
    const workingEndpoints = Object.entries(results)
      .filter(([_, data]) => data.success)
      .map(([endpoint, _]) => endpoint);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: `Explored ${endpointsToTry.length} Zettle API endpoints`,
        workingEndpoints,
        results
      })
    };
  } catch (error) {
    console.error('API exploration error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};