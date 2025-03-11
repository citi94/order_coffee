import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);

  const handleOptionChange = (optionName, value) => {
    setSelectedOptions({
      ...selectedOptions,
      [optionName]: value
    });
  };

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      options: selectedOptions,
      quantity: quantity
    });
    
    // Reset quantity
    setQuantity(1);
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white">
      {product.imageUrl && (
        <div className="h-48 bg-gray-200">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-4">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        
        <p className="text-gray-600 mb-4">{product.description}</p>
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold">£{(product.price / 100).toFixed(2)}</span>
          
          <div className="flex items-center">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="bg-gray-200 px-2 py-1 rounded-l"
            >
              -
            </button>
            <span className="bg-gray-100 px-3 py-1">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="bg-gray-200 px-2 py-1 rounded-r"
            >
              +
            </button>
          </div>
        </div>
        
        {product.options && product.options.length > 0 && (
          <div className="mb-4">
            {product.options.map((option) => (
              <div key={option.name} className="mb-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {option.name}
                </label>
                <select
                  className="w-full border rounded p-2"
                  value={selectedOptions[option.name] || ''}
                  onChange={(e) => handleOptionChange(option.name, e.target.value)}
                >
                  <option value="">Select {option.name}</option>
                  {option.values.map((value) => (
                    <option key={value.id} value={value.id}>
                      {value.name} {value.priceDelta !== 0 && `(${value.priceDelta > 0 ? '+' : ''}£${(value.priceDelta / 100).toFixed(2)})`}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        )}
        
        <button
          onClick={handleAddToCart}
          className="w-full bg-black text-white py-2 rounded hover:bg-gray-800 transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductCard;