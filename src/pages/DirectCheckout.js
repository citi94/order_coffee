import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder } from '../utils/api';

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
  const pickupTimes = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const time = new Date(now);
    time.setMinutes(now.getMinutes() + (i * 10));
    const hours = time.getHours().toString().padStart(2, '0');
    const mins = time.getMinutes().toString().padStart(2, '0');
    pickupTimes.push(`${hours}:${mins}`);
  }

  const handleSubmitOrder = async (e) => {
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
      
      // Format note and pickup time for Zettle API
      const formattedNote = `Pickup time: ${pickupTime}${note ? `. ${note}` : ''}`;
      
      // Create order data
      const orderData = {
        customerName: name,
        customerEmail: email,
        comment: formattedNote,
        items: items.map(item => ({
          id: item.id,
          name: item.name,
          quantity: item.quantity,
          unitPrice: item.price,
          options: item.options,
        })),
        totalAmount
      };
      
      console.log('Sending order data:', orderData);
      
      // Create test order in Zettle
      const orderResponse = await createOrder(orderData);
      
      console.log('Order creation response:', orderResponse);
      
      if (!orderResponse || !orderResponse.orderId) {
        throw new Error(orderResponse?.message || 'Failed to create order');
      }
      
      // Store order info in localStorage for confirmation page
      localStorage.setItem('pendingOrder', JSON.stringify({
        orderId: orderResponse.orderId,
        orderNumber: orderResponse.orderNumber,
        customerName: name,
        pickupTime: pickupTime,
        isTestOrder: true
      }));
      
      // Clear the cart
      clearCart();
      
      // Navigate to confirmation page
      navigate('/confirmation?orderId=' + orderResponse.orderId);
      
    } catch (err) {
      console.error('Order creation error:', err);
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
          
          <form onSubmit={handleSubmitOrder}>
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
            
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-3 rounded mb-4">
              <p className="font-bold">Test Order Mode</p>
              <p className="text-sm">Orders will be sent to the barista display without payment processing.</p>
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