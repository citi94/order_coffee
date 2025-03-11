const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Get access token from Zettle OAuth API
    const tokenResponse = await fetch('https://oauth.zettle.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + Buffer.from(process.env.ZETTLE_CLIENT_ID + ':' + process.env.ZETTLE_CLIENT_SECRET).toString('base64')
      },
      body: new URLSearchParams({
        'grant_type': 'client_credentials'
      }).toString()
    });

    const { access_token } = await tokenResponse.json();

    if (!access_token) {
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