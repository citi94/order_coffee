// In DirectCheckout.js, modify the handleSubmit function

const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    if (!name) {
      setError('Please enter your name to continue.');
      return;
    }
    
    if (!pickupTime) {
      setError('Please select a pickup time.');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Format note and pickup time
      const formattedNote = `Pickup time: ${pickupTime}${note ? `. ${note}` : ''}`;
      
      // Format order data
      const orderData = {
        customerName: name,
        customerEmail: email,
        comment: formattedNote,
        items: items.map(item => {
          // Format options as comment
          const optionsText = formatItemOptions(item.options);
          
          return {
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unitPrice: item.price,
            options: item.options,
            comment: optionsText
          };
        }),
        totalAmount,
        isTestOrder: true // Mark this as a test order
      };
      
      console.log('Submitting order data:', orderData);
      
      // Create order directly without payment
      const response = await axios.post('/.netlify/functions/create-order', orderData);
      
      console.log('Order creation response:', response.data);
      
      if (response.data.status === 'success') {
        // Store order info in local storage for confirmation page
        localStorage.setItem('pendingOrder', JSON.stringify({
          orderId: response.data.orderId,
          orderNumber: response.data.orderNumber,
          customerName: name,
          pickupTime,
          items,
          totalAmount,
          createdAt: new Date().toISOString(),
          isTestOrder: true
        }));
  
        clearCart();
        
        // Navigate to confirmation page
        navigate('/confirmation', { 
          state: { 
            orderId: response.data.orderId,
            orderNumber: response.data.orderNumber,
            customerName: name,
            pickupTime,
            isTestOrder: true
          }
        });
      } else {
        throw new Error(response.data.message || 'Failed to create order');
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(`Error: ${err.message || 'There was an error processing your order. Please try again.'}`);
      setLoading(false);
    }
  };