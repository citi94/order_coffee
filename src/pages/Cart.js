import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';

const Cart = () => {
  const { items, totalAmount, removeFromCart, updateQuantity, clearCart } = useCart();
  const navigate = useNavigate();

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
    
    return formattedOptions;
  };

  if (items.length === 0) {
    return (
      <div className="py-10 text-center">
        <h1 className="text-2xl font-bold mb-6">Your Order</h1>
        <p className="mb-6">Your order is empty.</p>
        <Link 
          to="/" 
          className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition"
        >
          Browse Menu
        </Link>
      </div>
    );
  }

  return (
    <div className="py-6 px-4">
      <h1 className="text-2xl font-bold mb-6">Your Order</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {items.map((item, index) => (
          <div key={index} className="flex items-center py-4 border-b last:border-b-0">
            <div className="flex-1">
              <h3 className="font-semibold">{item.name}</h3>
              {Object.keys(item.options || {}).length > 0 && (
                <div className="text-sm text-gray-600 mt-1">
                  {formatItemOptions(item.options).map((option, i) => (
                    <span key={i} className="mr-2">{option}</span>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex items-center">
              <button 
                onClick={() => updateQuantity(index, Math.max(1, item.quantity - 1))}
                className="bg-gray-200 px-2 py-1 rounded-l"
                aria-label="Decrease quantity"
              >
                -
              </button>
              <span className="bg-gray-100 px-3 py-1">{item.quantity}</span>
              <button 
                onClick={() => updateQuantity(index, item.quantity + 1)}
                className="bg-gray-200 px-2 py-1 rounded-r"
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            
            <div className="ml-6 w-24 text-right">
              £{((item.price * item.quantity) / 100).toFixed(2)}
            </div>
            
            <button 
              onClick={() => removeFromCart(index)}
              className="ml-4 text-red-500 hover:text-red-700"
              aria-label="Remove item"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        ))}
        
        <div className="flex justify-between items-center mt-6 pt-6 border-t">
          <button
            onClick={clearCart}
            className="text-red-500 hover:text-red-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Clear Order
          </button>
          
          <div className="text-right">
            <div className="text-lg font-bold">
              Total: £{(totalAmount / 100).toFixed(2)}
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex justify-between">
        <Link 
          to="/" 
          className="bg-gray-200 text-gray-800 px-6 py-2 rounded hover:bg-gray-300 transition"
        >
          Add More Items
        </Link>
        
        <button
          onClick={() => navigate('/checkout')}
          className="bg-black text-white px-8 py-2 rounded hover:bg-gray-800 transition"
        >
          Checkout
        </button>
      </div>
    </div>
  );
};

export default Cart;