const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Log environment variables (masked for security)
    console.log('Client ID available:', !!process.env.ZETTLE_CLIENT_ID);
    console.log('Client Secret available:', !!process.env.ZETTLE_CLIENT_SECRET);
    
    if (!process.env.ZETTLE_CLIENT_ID || !process.env.ZETTLE_CLIENT_SECRET) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Missing Zettle API credentials'
        })
      };
    }
    
    // Attempt to get an access token
    console.log('Attempting to get access token...');
    
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
    
    // Log token response (without exposing the actual token)
    console.log('Token response status:', tokenResponse.status);
    console.log('Token response has access_token:', !!tokenData.access_token);
    console.log('Token response has error:', !!tokenData.error);
    
    if (tokenData.error) {
      console.log('Error description:', tokenData.error_description);
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'error',
          message: 'Authentication failed',
          details: {
            error: tokenData.error,
            description: tokenData.error_description
          }
        })
      };
    }
    
    if (!tokenData.access_token) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'No access token returned',
          details: tokenData
        })
      };
    }

    // Token successfully obtained
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        message: 'Authentication successful',
        tokenType: tokenData.token_type,
        expiresIn: tokenData.expires_in
      })
    };
  } catch (error) {
    console.error('Error during authentication debug:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message,
      })
    };
  }
};