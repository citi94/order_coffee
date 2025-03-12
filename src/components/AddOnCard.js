import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const AddOnCard = ({ item }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  
  // Get base price
  const price = item.variants && item.variants.length > 0
    ? item.variants[0].price?.amount || item.price
    : item.price;
  
  // Clean the product name
  const cleanName = item.name.replace(/^(takeaway|eat-in)\s+/i, '');

  const handleAddToCart = () => {
    addToCart({
      id: item.uuid,
      name: cleanName,
      price: price,
      options: {},
      quantity: quantity
    });
    
    // Reset quantity
    setQuantity(1);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-4 flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <h3 className="font-bold">{cleanName}</h3>
        <span className="font-medium">£{(price / 100).toFixed(2)}</span>
      </div>
      
      {item.description && (
        <p className="text-gray-600 text-sm mb-4">{item.description}</p>
      )}
      
      <div className="mt-auto flex items-center justify-between">
        <div className="flex items-center">
          <button 
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="bg-gray-200 px-2 py-1 rounded-l text-sm"
          >
            -
          </button>
          <span className="bg-gray-100 px-3 py-1 text-sm">{quantity}</span>
          <button 
            onClick={() => setQuantity(quantity + 1)}
            className="bg-gray-200 px-2 py-1 rounded-r text-sm"
          >
            +
          </button>
        </div>
        
        <button
          onClick={handleAddToCart}
          className="ml-4 bg-black text-white px-3 py-1 rounded text-sm hover:bg-gray-800 transition"
        >
          Add
        </button>
      </div>
    </div>
  );
};

export default AddOnCard;