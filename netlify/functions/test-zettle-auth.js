// netlify/functions/test-zettle-auth.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    console.log('===== TESTING ZETTLE API CONNECTION =====');
    
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

    // Try different authentication approaches
    const authMethods = [
      {
        name: 'Client Credentials',
        params: {
          'grant_type': 'client_credentials',
          'client_id': clientId,
          'client_secret': clientSecret
        }
      },
      {
        name: 'JWT Bearer',
        params: {
          'grant_type': 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          'client_id': clientId,
          'assertion': clientSecret
        }
      },
      {
        name: 'Password Grant',
        params: {
          'grant_type': 'password',
          'client_id': clientId,
          'username': clientId,
          'password': clientSecret
        }
      }
    ];

    const results = {};

    for (const method of authMethods) {
      console.log(`Testing ${method.name} authentication...`);
      
      try {
        const tokenResponse = await fetch('https://oauth.zettle.com/token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: new URLSearchParams(method.params).toString()
        });
        
        const responseStatus = tokenResponse.status;
        const responseText = await tokenResponse.text();
        
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          responseData = { error: 'Invalid JSON response' };
        }
        
        results[method.name] = {
          status: responseStatus,
          success: responseStatus === 200,
          hasToken: !!responseData.access_token,
          tokenType: responseData.token_type,
          responseData: responseData
        };
        
        if (responseData.access_token) {
          // Try a simple API call with the token
          const testResponse = await fetch('https://purchase.izettle.com/organizations/self/info', {
            headers: {
              'Authorization': `Bearer ${responseData.access_token}`
            }
          });
          
          results[method.name].apiTestStatus = testResponse.status;
          try {
            const apiTestData = await testResponse.json();
            results[method.name].apiTestSuccess = testResponse.status === 200;
            results[method.name].apiTestData = apiTestData;
          } catch (e) {
            results[method.name].apiTestError = 'Failed to parse API test response';
          }
        }
      } catch (error) {
        results[method.name] = {
          error: error.message,
          success: false
        };
      }
    }
    
    // Return the results
    const successMethod = Object.entries(results).find(([_, data]) => data.success);
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: successMethod ? 'success' : 'error',
        message: successMethod 
          ? `Authentication successful with ${successMethod[0]} method` 
          : 'All authentication methods failed',
        results: results,
        recommendedMethod: successMethod ? successMethod[0] : null
      })
    };
  } catch (error) {
    console.error('Error testing Zettle authentication:', error);
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