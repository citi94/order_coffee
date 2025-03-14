// netlify/functions/explore-zettle-api-compact.js
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

    // List of Zettle API endpoints to explore - focus on purchase and order endpoints
    const endpointsToTry = [
      // Purchase and Order endpoints - most relevant for our needs
      'https://purchase.izettle.com/purchases/v2',
      'https://purchase.izettle.com/purchases/v2/orders',
      'https://purchase.izettle.com/v2/orders',
      'https://purchase.izettle.com/v2/purchases',
      'https://order.izettle.com/organizations/self/orders'
    ];
    
    const results = {};
    
    // Try GET on each endpoint to see what's available
    for (const endpoint of endpointsToTry) {
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        
        const status = response.status;
        let dataInfo = { status };
        
        try {
          if (status !== 404) {
            const responseText = await response.text();
            try {
              // Try to parse as JSON
              const jsonData = JSON.parse(responseText);
              // Only store structure info, not full data
              if (Array.isArray(jsonData)) {
                dataInfo.type = 'array';
                dataInfo.length = jsonData.length;
                dataInfo.sample = jsonData.length > 0 ? 
                  truncateObject(jsonData[0], 2) : null;
              } else {
                dataInfo.type = 'object';
                dataInfo.keys = Object.keys(jsonData);
                dataInfo.sample = truncateObject(jsonData, 2);
              }
            } catch {
              // If not parseable JSON, note that
              dataInfo.type = 'text';
              dataInfo.preview = responseText.substring(0, 100);
            }
          } else {
            dataInfo.type = 'not found';
          }
        } catch (error) {
          dataInfo.error = error.message;
        }
        
        results[endpoint] = dataInfo;
      } catch (error) {
        results[endpoint] = {
          error: error.message
        };
      }
    }
    
    // Now test POST method on some key endpoints to see if they accept orders
    const testOrder = {
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
      ],
      metadata: {
        customerName: "API Test"
      }
    };
    
    const postResults = {};
    
    for (const endpoint of endpointsToTry) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${access_token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(testOrder)
        });
        
        const status = response.status;
        let dataInfo = { status };
        
        if (status !== 404) {
          try {
            const responseText = await response.text();
            try {
              // Try to parse as JSON
              const jsonData = JSON.parse(responseText);
              dataInfo.response = jsonData;
            } catch {
              // If not parseable JSON, note that
              dataInfo.response = responseText.substring(0, 300);
            }
          } catch (error) {
            dataInfo.error = error.message;
          }
        }
        
        postResults[endpoint] = dataInfo;
      } catch (error) {
        postResults[endpoint] = {
          error: error.message
        };
      }
    }
    
    // Try to analyze documentation or API structure
    let apiDocumentation = null;
    try {
      const docsResponse = await fetch('https://developer.zettle.com/api-references/order-api', {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (docsResponse.status === 200) {
        const docsText = await docsResponse.text();
        apiDocumentation = {
          available: true,
          preview: docsText.substring(0, 300)
        };
      }
    } catch (error) {
      apiDocumentation = {
        error: error.message
      };
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        getResults: results,
        postResults: postResults,
        apiDocumentation,
        recommendedEndpoint: findRecommendedEndpoint(postResults)
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

// Helper to truncate large objects for display
function truncateObject(obj, depth = 1, currentDepth = 0) {
  if (currentDepth >= depth) {
    if (Array.isArray(obj)) {
      return `[Array(${obj.length})]`;
    } else if (typeof obj === 'object' && obj !== null) {
      return `{Object with keys: ${Object.keys(obj).join(', ')}}`;
    }
    return obj;
  }
  
  if (Array.isArray(obj)) {
    return obj.slice(0, 2).map(item => 
      truncateObject(item, depth, currentDepth + 1)
    );
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const result = {};
    Object.keys(obj).slice(0, 5).forEach(key => {
      result[key] = truncateObject(obj[key], depth, currentDepth + 1);
    });
    return result;
  }
  
  return obj;
}

// Helper to find the best endpoint to use
function findRecommendedEndpoint(postResults) {
  // Look for successful POST responses (status 200/201)
  const successfulEndpoints = Object.entries(postResults)
    .filter(([_, data]) => data.status === 200 || data.status === 201);
  
  if (successfulEndpoints.length > 0) {
    return successfulEndpoints[0][0];
  }
  
  // If no successes, look for endpoints that returned useful info (not 404)
  const potentialEndpoints = Object.entries(postResults)
    .filter(([_, data]) => data.status !== 404);
  
  if (potentialEndpoints.length > 0) {
    return potentialEndpoints[0][0];
  }
  
  return null;
}