const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Get access token - using the same method as your working display app
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
      console.error('Token response:', tokenData);
      throw new Error('Failed to obtain access token');
    }

    // Fetch products from Zettle
    const productsResponse = await fetch(
      'https://inventory.izettle.com/organizations/self/products',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    const productsData = await productsResponse.json();
    
    // Check if we received a valid response
    if (!Array.isArray(productsData)) {
      console.error('Unexpected product data format:', productsData);
      throw new Error('Invalid product data received from Zettle');
    }

    // Format products for our frontend
    const formattedProducts = productsData.map(product => ({
      id: product.uuid,
      name: product.name,
      description: product.description || '',
      price: product.variants[0]?.price?.amount, // In cents
      imageUrl: product.imageUrl,
      category: product.categories?.[0]?.name || 'Other',
      options: [] // We'll add option handling later
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        products: formattedProducts,
      }),
    };
  } catch (error) {
    console.error('Error fetching menu:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message,
      })
    };
  }
};