import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [milkOption, setMilkOption] = useState('');

  // Default milk options
  const milkOptions = [
    { id: 'regular', name: 'Regular Milk', priceDelta: 0 },
    { id: 'oat', name: 'Oat Milk', priceDelta: 50 },
    { id: 'almond', name: 'Almond Milk', priceDelta: 50 },
    { id: 'soy', name: 'Soy Milk', priceDelta: 50 }
  ];

  // Default size options for drinks
  const sizeOptions = [
    { id: 'regular', name: 'Regular', priceDelta: 0 },
    { id: 'large', name: 'Large', priceDelta: 50 }
  ];

  const handleMilkChange = (e) => {
    setMilkOption(e.target.value);
    
    // Update the options state
    setSelectedOptions({
      ...selectedOptions,
      milk: e.target.value
    });
  };

  const handleSizeChange = (e) => {
    setSelectedOptions({
      ...selectedOptions,
      size: e.target.value
    });
  };

  const handleAddToCart = () => {
    // Create a name that includes the selected options
    let itemName = product.name;
    
    // Calculate final price including any option upcharges
    let finalPrice = product.price;
    
    if (selectedOptions.milk) {
      const selectedMilk = milkOptions.find(option => option.id === selectedOptions.milk);
      if (selectedMilk && selectedMilk.priceDelta) {
        finalPrice += selectedMilk.priceDelta;
      }
    }
    
    if (selectedOptions.size === 'large') {
      finalPrice += 50; // Add 50p for large size
    }
    
    addToCart({
      id: product.id,
      name: itemName,
      price: finalPrice,
      options: selectedOptions,
      quantity: quantity
    });
    
    // Reset selection
    setQuantity(1);
    setSelectedOptions({});
    setMilkOption('');
  };

  // Check if this is a coffee drink that should have milk options
  const isCoffeeDrink = product.category === 'Coffee' && 
                        !product.name.toLowerCase().includes('espresso') &&
                        !product.name.toLowerCase().includes('americano');

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white h-full flex flex-col">
      <div className="p-4 flex-grow">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        
        {product.description && (
          <p className="text-gray-600 mb-4">{product.description}</p>
        )}
        
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
        
        {/* Size options for all drinks */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Size
          </label>
          <select
            className="w-full border rounded p-2"
            value={selectedOptions.size || ''}
            onChange={handleSizeChange}
          >
            <option value="">Select Size</option>
            {sizeOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.name} {option.priceDelta > 0 && `(+£${(option.priceDelta / 100).toFixed(2)})`}
              </option>
            ))}
          </select>
        </div>
        
        {/* Milk options only for coffee drinks that typically have milk */}
        {isCoffeeDrink && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Milk Option
            </label>
            <select
              className="w-full border rounded p-2"
              value={milkOption}
              onChange={handleMilkChange}
            >
              <option value="">Select Milk</option>
              {milkOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} {option.priceDelta > 0 && `(+£${(option.priceDelta / 100).toFixed(2)})`}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="p-4 pt-0">
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