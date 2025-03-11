import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { createOrder, initiatePayment } from '../utils/api';

const Checkout = () => {
  const navigate = useNavigate();
  const { items, totalAmount, clearCart } = useCart();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect to menu if cart is empty
  React.useEffect(() => {
    if (items.length === 0) {
      navigate('/');
    }
  }, [items, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (loading) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Create order first
      const orderData = {
        customerName: name,
        customerEmail: email,
        comment,
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
            orderNumber: orderResponse.orderNumber 
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
          <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
          
          {items.map((item, index) => (
            <div key={index} className="flex justify-between py-2 border-b last:border-b-0">
              <div>
                <span className="font-medium">{item.quantity}x </span>
                {item.name}
                {Object.entries(item.options).length > 0 && (
                  <div className="text-sm text-gray-600">
                    {Object.entries(item.options).map(([key, value]) => (
                      <div key={key}>
                        {key}: {value}
                      </div>
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
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border rounded p-2"
                required
              />
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
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
                Special Instructions (optional)
              </label>
              <textarea
                id="comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full border rounded p-2"
                rows="3"
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
              {loading ? 'Processing...' : 'Pay with Apple Pay / Google Pay'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Checkout;