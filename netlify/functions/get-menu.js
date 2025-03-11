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

    // Try the current product library endpoint first
    console.log('Fetching products from Zettle API...');
    const productsResponse = await fetch(
      'https://products.izettle.com/organizations/self/products/v2',
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
    
    // Check if we got a products array
    let products = [];
    
    // Handle different response formats
    if (Array.isArray(productsData)) {
      // Direct array of products (older API)
      products = productsData;
    } else if (productsData.data && Array.isArray(productsData.data)) {
      // Newer API with data property containing products
      products = productsData.data;
    } else if (productsData.products && Array.isArray(productsData.products)) {
      // Another possible format with products property
      products = productsData.products;
    } else {
      // If we can't figure out the format, return the data for debugging
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Unexpected product data format',
          dataType: typeof productsData,
          isArray: Array.isArray(productsData),
          preview: JSON.stringify(productsData).substring(0, 500) + '...'
        })
      };
    }

    // Format products for our frontend (with additional error handling)
    try {
      console.log(`Processing ${products.length} products...`);
      const formattedProducts = products.map(product => {
        // Log the first product to understand structure
        if (products.indexOf(product) === 0) {
          console.log('First product structure:', JSON.stringify(product).substring(0, 500) + '...');
        }
        
        // Check if product has the expected structure
        if (!product) {
          console.warn('Null or undefined product found');
          return null;
        }
        
        // Handle different product structures
        const uuid = product.uuid || product.id || product.productId;
        if (!uuid) {
          console.warn('Product without ID:', JSON.stringify(product).substring(0, 200));
          return null;
        }
        
        // Extract price - handle different structures
        let price = 0;
        if (product.variants && product.variants[0] && product.variants[0].price) {
          price = product.variants[0].price.amount;
        } else if (product.price && product.price.amount) {
          price = product.price.amount;
        } else if (product.price) {
          price = typeof product.price === 'number' ? product.price : 0;
        }
        
        // Extract category
        let category = 'Other';
        if (product.categories && product.categories[0] && product.categories[0].name) {
          category = product.categories[0].name;
        } else if (product.category && product.category.name) {
          category = product.category.name;
        } else if (product.categoryName) {
          category = product.categoryName;
        }
        
        return {
          id: uuid,
          name: product.name || 'Unnamed Product',
          description: product.description || '',
          price: price,
          imageUrl: product.imageUrl || product.image || '',
          category: category,
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