const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Get product ID from query parameters
    const productId = event.queryStringParameters?.productId;
    
    if (!productId) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          status: 'error',
          message: 'Product ID is required'
        })
      };
    }
    
    // Get access token
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
      console.error('Token response:', JSON.stringify(tokenData));
      throw new Error('Failed to obtain access token');
    }

    // Fetch products from Zettle
    const productsResponse = await fetch(
      'https://products.izettle.com/organizations/self/products/v2',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    const productsData = await productsResponse.json();
    
    if (!Array.isArray(productsData)) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Unexpected product data format',
          preview: JSON.stringify(productsData).substring(0, 200) + '...'
        })
      };
    }
    
    // Find the specified product
    const product = productsData.find(p => p.uuid === productId);
    
    if (!product) {
      return {
        statusCode: 404,
        body: JSON.stringify({
          status: 'error',
          message: 'Product not found',
          availableProductIds: productsData.slice(0, 5).map(p => p.uuid)
        })
      };
    }
    
    // Get a sample of coffee products
    const coffeeProducts = productsData
      .filter(p => {
        // Check if it's a coffee product
        const isCoffee = 
          (p.categories && p.categories.some(c => c.name === 'Coffee')) ||
          p.name.toLowerCase().includes('coffee') ||
          p.name.toLowerCase().includes('latte') ||
          p.name.toLowerCase().includes('cappuccino') ||
          p.name.toLowerCase().includes('espresso');
        
        return isCoffee;
      })
      .slice(0, 5); // Take 5 coffee products as sample
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        requestedProduct: product,
        coffeeProducts: coffeeProducts,
        sampleProducts: {
          withVariants: productsData.filter(p => p.variants && p.variants.length > 1).slice(0, 3),
          withOptions: productsData.filter(p => p.optionGroups && p.optionGroups.length > 0).slice(0, 3)
        }
      })
    };
  } catch (error) {
    console.error('Error fetching product structure:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};