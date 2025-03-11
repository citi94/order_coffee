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
    
    // If we got a token, test the products endpoint
    console.log('Testing products endpoint...');
    const productsResponse = await fetch(
      'https://inventory.izettle.com/organizations/self/products',
      {
        headers: {
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      }
    );
    
    console.log('Products response status:', productsResponse.status);
    
    const productsText = await productsResponse.text();
    console.log('Products response (first 200 chars):', productsText.substring(0, 200) + '...');
    
    try {
      const productsData = JSON.parse(productsText);
      console.log('Products response type:', typeof productsData);
      console.log('Is array:', Array.isArray(productsData));
      console.log('Items count:', Array.isArray(productsData) ? productsData.length : 'N/A');
      
      // Sample of data structure
      if (Array.isArray(productsData) && productsData.length > 0) {
        console.log('Sample product structure:', JSON.stringify(productsData[0]).substring(0, 500) + '...');
      }
      
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'success',
          message: 'Zettle API connection successful',
          tokenStatus: {
            received: true,
            type: tokenData.token_type,
            expiresIn: tokenData.expires_in
          },
          productsStatus: {
            status: productsResponse.status,
            isArray: Array.isArray(productsData),
            count: Array.isArray(productsData) ? productsData.length : 0
          }
        })
      };
    } catch (error) {
      console.error('Failed to parse products response:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to parse products response',
          tokenStatus: {
            received: true
          },
          responseText: productsText.substring(0, 500) + '...'
        })
      };
    }
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