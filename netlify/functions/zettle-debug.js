const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    console.log('---- ZETTLE API DEBUG INFO ----');
    
    // Check environment variables
    const clientId = process.env.ZETTLE_CLIENT_ID;
    const clientSecret = process.env.ZETTLE_CLIENT_SECRET;
    
    console.log('Client ID available:', !!clientId);
    console.log('Client Secret available:', !!clientSecret);
    
    if (!clientId || !clientSecret) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Missing Zettle API credentials',
          environmentVars: {
            ZETTLE_CLIENT_ID: !!clientId,
            ZETTLE_CLIENT_SECRET: !!clientSecret
          }
        })
      };
    }
    
    // Test token request
    console.log('Testing token request...');
    const tokenResponse = await fetch('https://oauth.zettle.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        'client_id': clientId,
        'assertion': clientSecret
      }).toString()
    });
    
    console.log('Token response status:', tokenResponse.status);
    
    const tokenText = await tokenResponse.text();
    let tokenData;
    
    try {
      tokenData = JSON.parse(tokenText);
      console.log('Token response parsed successfully');
    } catch (error) {
      console.error('Failed to parse token response:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to parse token response',
          responseText: tokenText
        })
      };
    }
    
    const hasToken = !!tokenData.access_token;
    console.log('Received access token:', hasToken);
    
    if (!hasToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to authenticate with Zettle',
          details: {
            error: tokenData.error,
            error_description: tokenData.error_description
          }
        })
      };
    }
    
    // If we got a token, test multiple product endpoints
    const endpointsToTry = [
      'https://inventory.izettle.com/organizations/self/products', // Old endpoint
      'https://products.izettle.com/organizations/self/products/v2', // New v2 endpoint
      'https://products.izettle.com/organizations/self/products', // New endpoint without version
      'https://public.izettle.com/products/v2/organizations/self/products', // Another possible endpoint
      'https://inventory.izettle.com/v2/organizations/self/products' // Another variation
    ];
    
    const results = {};
    
    for (const endpoint of endpointsToTry) {
      console.log(`Testing endpoint: ${endpoint}`);
      
      try {
        const response = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${tokenData.access_token}`
          }
        });
        
        console.log(`${endpoint} status:`, response.status);
        
        const responseText = await response.text();
        
        try {
          const data = JSON.parse(responseText);
          results[endpoint] = {
            status: response.status,
            isArray: Array.isArray(data),
            isObject: typeof data === 'object' && !Array.isArray(data),
            dataKeys: typeof data === 'object' && !Array.isArray(data) ? Object.keys(data) : [],
            itemCount: Array.isArray(data) ? data.length : (data.data && Array.isArray(data.data) ? data.data.length : 'N/A')
          };
          
          if (response.status === 200) {
            // Save a sample of the successful response
            results[endpoint].sampleData = JSON.stringify(data).substring(0, 500) + '...';
          }
        } catch (error) {
          results[endpoint] = {
            status: response.status,
            error: 'Failed to parse JSON',
            sampleResponse: responseText.substring(0, 200) + '...'
          };
        }
      } catch (error) {
        results[endpoint] = {
          error: error.message
        };
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Zettle API endpoint tests completed',
        tokenStatus: {
          received: true,
          type: tokenData.token_type,
          expiresIn: tokenData.expires_in
        },
        endpointResults: results
      })
    };
  } catch (error) {
    console.error('Debug function error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};