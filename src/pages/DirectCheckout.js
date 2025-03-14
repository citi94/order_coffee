// src/pages/DirectCheckout.js - REVISED APPROACH
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import axios from 'axios';

const DirectCheckout = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const [name, setName] = useState('');
  const [pickupTime, setPickupTime] = useState('');
  const [email, setEmail] = useState('');
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect to menu if cart is empty
  useEffect(() => {
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

  const formatItemOptions = (options) => {
    const formattedOptions = [];
    
    if (options.size && options.size !== 'Regular') {
      formattedOptions.push(options.size);
    }
    
    if (options.milk && options.milk !== 'Dairy') {
      formattedOptions.push(`${options.milk} milk`);
    }
    
    if (options.caffeinated === false) {
      formattedOptions.push('Decaf');
    }
    
    return formattedOptions.join(', ');
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
      
      console.log('Submitting order data directly to Zettle:', orderData);
      
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

  return (
    <div className="py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Checkout</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Order summary */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          
          {items.map((item, index) => (
            <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
              <div>
                <span className="font-medium">{item.quantity}x </span>
                {item.name}
                {Object.keys(item.options || {}).length > 0 && (
                  <div className="text-sm text-gray-600">
                    {formatItemOptions(item.options)}
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
          <h2 className="text-xl font-semibold mb-4">Pickup Details</h2>
          
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
                Email (optional)
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border rounded p-2"
                placeholder="For receipt (optional)"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="note" className="block text-sm font-medium text-gray-700 mb-1">
                Order Note (optional)
              </label>
              <textarea
                id="note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full border rounded p-2"
                rows="2"
                placeholder="Any special requests"
              />
            </div>
            
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
                {error}
              </div>
            )}
            
            <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4" role="alert">
              <p className="font-bold">Test Mode</p>
              <p>This will create a test order in Zettle without processing payment.</p>
            </div>
            
            <button
              type="submit"
              disabled={loading}
              className={`w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? 'Processing...' : 'Place Test Order'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DirectCheckout;