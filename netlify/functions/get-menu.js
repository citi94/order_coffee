const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Get access token
    console.log('Attempting to get Zettle access token...');
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

    console.log('Successfully obtained access token');

    // Fetch products from Zettle
    console.log('Fetching products from Zettle API...');
    const productsResponse = await fetch(
      'https://inventory.izettle.com/organizations/self/products',
      {
        headers: {
          'Authorization': `Bearer ${access_token}`
        }
      }
    );

    console.log('Products API Status:', productsResponse.status);
    
    // Get response as text first for debugging
    const responseText = await productsResponse.text();
    console.log('Raw response (first 200 chars):', responseText.substring(0, 200) + '...');
    
    // Try to parse as JSON
    let productsData;
    try {
      productsData = JSON.parse(responseText);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Failed to parse product data as JSON',
          rawResponse: responseText.substring(0, 500) + '...'
        })
      };
    }
    
    // Check response type
    console.log('Response type:', typeof productsData);
    console.log('Is array:', Array.isArray(productsData));
    
    // If not an array, check for specific error patterns
    if (!Array.isArray(productsData)) {
      // Handle potential error response
      if (productsData.error) {
        console.error('API error:', productsData.error);
        return {
          statusCode: 500,
          body: JSON.stringify({
            status: 'error',
            message: 'Zettle API error',
            details: productsData
          })
        };
      }
      
      // If it's an object with different structure
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Unexpected product data format',
          dataType: typeof productsData,
          preview: JSON.stringify(productsData).substring(0, 500) + '...'
        })
      };
    }

    // If we got an empty array
    if (Array.isArray(productsData) && productsData.length === 0) {
      console.log('Received empty products array from API');
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'success',
          message: 'No products found',
          products: []
        })
      };
    }

    // Format products for our frontend (with additional error handling)
    try {
      console.log('Formatting products data...');
      const formattedProducts = productsData.map(product => {
        // Check if product has the expected structure
        if (!product || !product.uuid) {
          console.warn('Malformed product:', JSON.stringify(product));
          return null;
        }
        
        return {
          id: product.uuid,
          name: product.name || 'Unnamed Product',
          description: product.description || '',
          price: product.variants && product.variants[0] && 
                 product.variants[0].price && product.variants[0].price.amount || 0,
          imageUrl: product.imageUrl || '',
          category: product.categories && product.categories[0] && 
                    product.categories[0].name || 'Other',
          options: [] // We'll add option handling later
        };
      }).filter(product => product !== null); // Remove any null products
      
      console.log(`Successfully formatted ${formattedProducts.length} products`);
      return {
        statusCode: 200,
        body: JSON.stringify({
          status: 'success',
          products: formattedProducts,
        }),
      };
    } catch (error) {
      console.error('Error formatting products:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Error formatting product data',
          error: error.message
        })
      };
    }
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