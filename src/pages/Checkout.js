import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder, initiatePayment } from '../utils/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect to menu if cart is empty
  React.useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  // Generate pickup time options (every 10 minutes for the next 2 hours)
  const generatePickupTimes = () => {
    const times = [];
    const now = new Date();
    const startTime = new Date(now);
    
    // Round current time up to the nearest 10 minutes
    const minutes = now.getMinutes();
    const remainder = minutes % 10;
    const minutesToAdd = remainder === 0 ? 10 : 10 - remainder;
    
    startTime.setMinutes(now.getMinutes() + minutesToAdd);
    startTime.setSeconds(0);
    startTime.setMilliseconds(0);
    
    // Generate times for next 2 hours in 10-minute increments
    for (let i = 0; i < 12; i++) {
      const time = new Date(startTime);
      time.setMinutes(time.getMinutes() + (i * 10));
      
      // Format time as HH:MM
      const hours = time.getHours().toString().padStart(2, '0');
      const mins = time.getMinutes().toString().padStart(2, '0');
      const timeString = `${hours}:${mins}`;
      
      times.push(timeString);
    }
    
    return times;
  };
  
  const pickupTimes = generatePickupTimes();

  const formatOptions = (options) => {
    const formattedOptions = [];
    
    // Handle milk option with improved display
    if (options.milk) {
      const milkName = {
        'regular': 'Regular Milk',
        'oat': 'Oat Milk',
        'almond': 'Almond Milk',
        'soy': 'Soy Milk'
      }[options.milk] || options.milk;
      
      formattedOptions.push(milkName);
    }
    
    // Handle size option with improved display
    if (options.size) {
      const sizeName = {
        'regular': 'Regular Size',
        'large': 'Large Size'
      }[options.size] || options.size;
      
      formattedOptions.push(sizeName);
    }
    
    // Add any other options
    Object.entries(options).forEach(([key, value]) => {
      if (key !== 'milk' && key !== 'size') {
        formattedOptions.push(`${key}: ${value}`);
      }
    });
    
    return formattedOptions;
  };

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
      
      // Create order first
      const orderData = {
        customerName: name,
        customerEmail: email,
        comment: `Pickup time: ${pickupTime}${specialInstructions ? '. ' + specialInstructions : ''}`,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          options: item.options
        })),
        totalAmount
      };
      
      const orderResponse = await createOrder(orderData);
      
      // Then initiate payment
      const paymentResponse = await initiatePayment({
        orderId: orderResponse.orderId,
        amount: totalAmount
      });
      
      // If we have Apple Pay / Google Pay support
      if (paymentResponse.paymentUrl) {
        // For Apple Pay / Google Pay, we'll handle in the browser
        // This is simplified - in a real app you would integrate with the Payment Request API
        window.location.href = paymentResponse.paymentUrl;
      } else {
        // Save the payment ID to check status later
        localStorage.setItem('currentPaymentId', paymentResponse.paymentId);
        
        // For now, let's simulate a successful payment and go to confirmation
        clearCart();
        navigate('/confirmation', { 
          state: { 
            orderId: orderResponse.orderId,
            orderNumber: orderResponse.orderNumber,
            pickupTime: pickupTime
          } 
        });
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError('There was an error processing your order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Order</h2>
          
          {items.map((item, index) => (
            <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
              <div>
                <span className="font-medium">{item.quantity}x </span>
                {item.name}
                {Object.keys(item.options).length > 0 && (
                  <div className="text-sm text-gray-600">
                    {formatOptions(item.options).map((option, i) => (
                      <div key={i}>{option}</div>
                    ))}
                  </div>
                )}
              </div>
              <div>£{((item.price * item.quantity) / 100).toFixed(2)}</div>
            </div>
          ))}
          
          <div className="flex justify-between mt-4 pt-4 border-t font-semibold">
            <div>Total</div>
            <div>£{(totalAmount / 100).toFixed(2)}</div>
          </div>
        </div>
        
        {/* Customer information */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Your Details</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded p-2"
                required
                placeholder="Your name for the order"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="pickupTime" className="block text-sm font-medium text-gray-700 mb-1">
                Pickup Time <span className="text-red-500">*</span>
              </label>
              <select
                id="pickupTime"
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full border rounded p-2"
                required
              >
                <option value="">Select pickup time</option>
                {pickupTimes.map(time => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
            
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email (for receipt - optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="your@email.com (optional)"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="specialInstructions" className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions (optional)
              </label>
              <textarea
                id="specialInstructions"
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                className="w-full border rounded p-2"
                rows="3"
                placeholder="Any special requests for your drinks"
              />
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                {error}
              </div>
            )}
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Processing...' : 'Pay Now'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;