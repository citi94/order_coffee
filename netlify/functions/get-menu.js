const fetch = require('node-fetch');

exports.handler = async function (event, context) {
  try {
    // Add debugging information about environment
    console.log('Environment variables available:', {
      clientIdExists: !!process.env.ZETTLE_CLIENT_ID,
      clientSecretExists: !!process.env.ZETTLE_CLIENT_SECRET
    });

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

    // Try multiple API endpoints to find the right one
    const endpoints = [
      'https://products.izettle.com/organizations/self/products/v2',
      'https://inventory.izettle.com/organizations/self/products'
    ];
    
    let products = [];
    let successfulEndpoint = null;
    
    for (const endpoint of endpoints) {
      try {
        console.log(`Trying endpoint: ${endpoint}`);
        const productsResponse = await fetch(endpoint, {
          headers: {
            'Authorization': `Bearer ${access_token}`
          }
        });
        
        if (productsResponse.status !== 200) {
          console.log(`Endpoint ${endpoint} returned status ${productsResponse.status}`);
          continue;
        }
        
        const responseText = await productsResponse.text();
        
        if (!responseText || responseText.trim() === '') {
          console.log(`Endpoint ${endpoint} returned empty response`);
          continue;
        }
        
        let productsData = JSON.parse(responseText);
        
        // Extract products based on the response format
        let extractedProducts = [];
        
        if (Array.isArray(productsData)) {
          extractedProducts = productsData;
        } else if (productsData.data && Array.isArray(productsData.data)) {
          extractedProducts = productsData.data;
        } else if (productsData.products && Array.isArray(productsData.products)) {
          extractedProducts = productsData.products;
        } else {
          console.log(`Endpoint ${endpoint} returned unexpected format:`, typeof productsData);
          continue;
        }
        
        if (extractedProducts.length > 0) {
          products = extractedProducts;
          successfulEndpoint = endpoint;
          console.log(`Successfully got ${products.length} products from ${endpoint}`);
          break;
        } else {
          console.log(`Endpoint ${endpoint} returned 0 products`);
        }
      } catch (error) {
        console.error(`Error with endpoint ${endpoint}:`, error);
      }
    }
    
    if (products.length === 0) {
      return {
        statusCode: 500,
        body: JSON.stringify({
          status: 'error',
          message: 'Could not retrieve products from any endpoint',
          testedEndpoints: endpoints
        })
      };
    }

    // Format products for our frontend
    console.log(`Processing ${products.length} products...`);
    const formattedProducts = products.map(product => {
      // Log the first few products for debugging
      if (products.indexOf(product) < 3) {
        console.log(`Sample product ${products.indexOf(product) + 1}:`, JSON.stringify(product).substring(0, 500));
      }
      
      // Handle different product structures
      const uuid = product.uuid || product.id || product.productId;
      if (!uuid) {
        console.warn('Product without ID found - skipping');
        return null;
      }
      
      // Extract price - handle different structures
      let price = 0;
      if (product.variants && product.variants.length > 0 && product.variants[0].price) {
        price = product.variants[0].price.amount;
      } else if (product.price && product.price.amount) {
        price = product.price.amount;
      } else if (product.price) {
        price = typeof product.price === 'number' ? product.price : 0;
      }
      
      // Extract category
      let category = { name: 'Other' };
      if (product.category && product.category.name) {
        category = { name: product.category.name };
      } else if (product.categories && product.categories.length > 0 && product.categories[0].name) {
        category = { name: product.categories[0].name };
      }
      
      // Make a special check for coffee products by name if no category is present
      if (category.name === 'Other') {
        const name = (product.name || '').toLowerCase();
        if (name.includes('coffee') || 
            name.includes('latte') || 
            name.includes('cappuccino') || 
            name.includes('espresso') ||
            name.includes('americano') ||
            name.includes('flat white') ||
            name.includes('mocha')) {
          category = { name: 'Coffee' };
        }
      }
      
      return {
        id: uuid,
        uuid: uuid,
        name: product.name || 'Unnamed Product',
        description: product.description || '',
        price: price,
        imageUrl: product.imageUrl || product.image || '',
        category: category,
        variants: product.variants || []
      };
    }).filter(product => product !== null);
    
    // Log category counts for debugging
    const categoryCount = {};
    formattedProducts.forEach(p => {
      const catName = p.category?.name || 'Uncategorized';
      categoryCount[catName] = (categoryCount[catName] || 0) + 1;
    });
    console.log('Product categories:', categoryCount);
    
    // Check for coffee products
    const hasCoffee = formattedProducts.some(p => p.category && p.category.name === 'Coffee');
    if (!hasCoffee) {
      console.log('Warning: No coffee products found in the data');
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        status: 'success',
        products: formattedProducts,
        debug: {
          endpoint: successfulEndpoint,
          totalProducts: formattedProducts.length,
          categories: categoryCount,
          hasCoffeeProducts: hasCoffee
        }
      })
    };
    
  } catch (error) {
    console.error('Error in get-menu function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        status: 'error',
        message: error.message
      })
    };
  }
};