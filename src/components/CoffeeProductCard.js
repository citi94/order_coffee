import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const CoffeeProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [milkType, setMilkType] = useState('Regular');

  // Common milk alternatives
  const milkOptions = [
    { id: 'regular', name: 'Regular' },
    { id: 'oat', name: 'Oat Milk' },
    { id: 'almond', name: 'Almond Milk' },
    { id: 'soy', name: 'Soy Milk' }
  ];

  // Clean up product name - remove eat-in/takeaway prefixes
  const getDisplayName = () => {
    let name = product.name || '';
    name = name.replace(/^(takeaway|eat-in)\s+/i, '');
    return name;
  };

  const handleAddToCart = () => {
    // Create item for cart
    const item = {
      id: product.id || product.uuid,
      name: getDisplayName(),
      price: product.price,
      options: {
        milk: milkType !== 'Regular' ? milkType : ''
      },
      quantity: quantity
    };
    
    // Add milk type to display name if not regular
    if (milkType !== 'Regular') {
      item.name = `${item.name} (${milkType})`;
    }
    
    // Add to cart
    addToCart(item);
    
    // Reset quantity but keep milk selection for convenience
    setQuantity(1);
  };

  // Skip items with "Eat-in" in the name
  if (product.name && product.name.toLowerCase().includes('eat-in')) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white h-full flex flex-col">
      <div className="p-4 flex-grow">
        <h3 className="text-xl font-semibold mb-2">{getDisplayName()}</h3>
        
        {product.description && (
          <p className="text-gray-600 mb-4">{product.description}</p>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold">£{(product.price / 100).toFixed(2)}</span>
          
          <div className="flex items-center">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="bg-gray-200 px-3 py-1 rounded-l"
              aria-label="Decrease quantity"
            >
              -
            </button>
            <span className="bg-gray-100 px-4 py-1">{quantity}</span>
            <button 
              onClick={() => setQuantity(quantity + 1)}
              className="bg-gray-200 px-3 py-1 rounded-r"
              aria-label="Increase quantity"
            >
              +
            </button>
          </div>
        </div>
        
        {/* Milk options */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Milk Option
          </label>
          <select
            className="w-full border rounded p-2"
            value={milkType}
            onChange={(e) => setMilkType(e.target.value)}
            aria-label="Select milk type"
          >
            {milkOptions.map((option) => (
              <option key={option.id} value={option.name}>
                {option.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      
      <div className="p-4 pt-0">
        <button
          onClick={handleAddToCart}
          className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition"
        >
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default CoffeeProductCard;