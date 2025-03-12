// In netlify/functions/debug-auth.js
const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    console.log('===== DEBUGGING ZETTLE AUTH =====');
    
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
    
    // Test token request with detailed logging
    console.log('Attempting to get access token with credentials...');
    console.log('Client ID first 5 chars:', clientId.substring(0, 5) + '...');
    console.log('Client Secret length:', clientSecret.length);
    
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
    console.log('Raw token response:', tokenText);
    
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
          details: tokenData
        })
      };
    }
    
    // If token obtained successfully, try a simple API call
    console.log('Testing a simple API call with the token...');
    const testApiCall = await fetch('https://purchase.izettle.com/purchases/v2', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`
      }
    });
    
    console.log('Test API call status:', testApiCall.status);
    const testApiResponse = await testApiCall.text();
    console.log('Test API response (first 200 chars):', testApiResponse.substring(0, 200));
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Authentication check completed',
        authStatus: {
          tokenReceived: hasToken,
          tokenType: tokenData.token_type,
          expiresIn: tokenData.expires_in
        },
        apiTestStatus: {
          status: testApiCall.status,
          responsePreview: testApiResponse.substring(0, 100) + '...'
        }
      })
    };
  } catch (error) {
    console.error('Debug auth error:', error);
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