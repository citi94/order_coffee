const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
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

    // Fetch product options from Zettle
    const optionsResponse = await fetch(
      'https://products.izettle.com/organizations/self/product-options/v2',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    let optionsData;
    try {
      optionsData = await optionsResponse.json();
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to parse options data',
          responseStatus: optionsResponse.status,
          responseText: await optionsResponse.text()
        })
      };
    }
    
    // Fetch variants from Zettle to understand size options
    const variantsResponse = await fetch(
      'https://products.izettle.com/organizations/self/variants/v2',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    let variantsData;
    try {
      variantsData = await variantsResponse.json();
    } catch (error) {
      // Continue even if variants fetch fails
      console.error('Failed to fetch variants:', error);
      variantsData = { data: [] };
    }
    
    // Fetch coffee products - we'll need to match options to products
    const productsResponse = await fetch(
      'https://products.izettle.com/organizations/self/products/v2',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    const productsData = await productsResponse.json();
    
    // Filter for coffee products
    const coffeeProducts = productsData.filter(p => {
      return (p.categories && p.categories.some(c => c.name === 'Coffee')) ||
        (p.category && p.category.name === 'Coffee') ||
        p.name.toLowerCase().includes('coffee') ||
        p.name.toLowerCase().includes('latte') ||
        p.name.toLowerCase().includes('cappuccino') ||
        p.name.toLowerCase().includes('espresso');
    });
    
    // Analyze all products to understand the structure
    // This will help us build a model of your product options
    const analysis = {
      totalProducts: productsData.length,
      coffeeProducts: coffeeProducts.length,
      optionsStructure: optionsData,
      sampleCoffeeProducts: coffeeProducts.slice(0, 3),
      milkOptions: {
        products: productsData.filter(p => 
          p.name.toLowerCase().includes('milk') || 
          p.category === 'Alternative milk'
        ).map(p => ({
          id: p.uuid,
          name: p.name,
          price: p.variants && p.variants[0] && p.variants[0].price 
            ? p.variants[0].price.amount 
            : null
        }))
      },
      sizeVariants: {
        count: variantsData.data ? variantsData.data.length : 0,
        samples: variantsData.data ? variantsData.data.slice(0, 5) : []
      }
    };
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        analysis: analysis
      })
    };
  } catch (error) {
    console.error('Error analyzing product options:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};