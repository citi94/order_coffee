import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const CustomizationModal = ({ coffee, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [milkType, setMilkType] = useState('Dairy');
  const [isCaffeinated, setIsCaffeinated] = useState(true);
  const [selectedSize, setSelectedSize] = useState('Regular');
  const [price, setPrice] = useState(0);

  // Extract available options from the coffee product
  const [milkOptions] = useState(() => {
    // Default milk options
    const defaultMilks = ['Dairy', 'Oat', 'Soy', 'Almond'];
    
    // Check if the product has specific variants with options
    if (coffee && coffee.variants && coffee.variants.length > 0) {
      // Extract milk options from variants
      const milkSet = new Set();
      const caffeinationSet = new Set();
      
      coffee.variants.forEach(variant => {
        if (variant && variant.options) {
          variant.options.forEach(option => {
            if (option && option.name === 'flavour' && option.value) {
              milkSet.add(option.value);
            }
            if (option && option.name === 'Style' && option.value) {
              // Handle caffeination style
              const isDecaf = option.value.trim().toLowerCase().includes('decaf');
              caffeinationSet.add(!isDecaf);
            }
          });
        }
      });
      
      // Update options if available from variants
      if (milkSet.size > 0) {
        return {
          milks: Array.from(milkSet),
          caffeination: Array.from(caffeinationSet)
        };
      }
    }
    
    return { milks: defaultMilks, caffeination: [true, false] };
  });

  // Calculate price based on selections
  useEffect(() => {
    if (!coffee) {
      setPrice(0);
      return;
    }
    
    // Start with base price
    let basePrice = coffee.price || 0;
    
    // Try to find matching variant with selected options
    if (coffee.variants && coffee.variants.length > 0) {
      const matchingVariant = coffee.variants.find(variant => {
        if (!variant || !variant.options) return false;
        
        const hasMilk = variant.options.some(opt => 
          opt && opt.name === 'flavour' && opt.value === milkType
        );
        
        const styleName = isCaffeinated ? 'Caffeinated' : 'Decaffeinated';
        const hasCaffeination = variant.options.some(opt => 
          opt && opt.name === 'Style' && 
          opt.value && opt.value.includes(styleName)
        );
        
        const hasTakeaway = variant.options.some(opt => 
          opt && opt.name === 'Finish' && 
          opt.value && opt.value.includes('Takeaway')
        );
        
        // For variants with Finish, must be takeaway
        if (variant.options.some(opt => opt && opt.name === 'Finish')) {
          return hasMilk && hasCaffeination && hasTakeaway;
        }
        
        // For variants without Finish
        return hasMilk && hasCaffeination;
      });
      
      if (matchingVariant && matchingVariant.price && matchingVariant.price.amount) {
        basePrice = matchingVariant.price.amount;
      } else if (coffee.variants[0] && coffee.variants[0].price && coffee.variants[0].price.amount) {
        // Fallback to first variant price
        basePrice = coffee.variants[0].price.amount;
      }
    }
    
    // Apply size multiplier
    let sizeMultiplier = 1;
    if (selectedSize === 'Large') {
      sizeMultiplier = 1.3; // 30% more for large
    } else if (selectedSize === 'Small') {
      sizeMultiplier = 0.8; // 20% less for small
    }
    
    // Calculate final price (rounded to nearest 5p)
    const calculatedPrice = Math.round((basePrice * sizeMultiplier) / 5) * 5;
    setPrice(calculatedPrice);
  }, [coffee, milkType, isCaffeinated, selectedSize]);

  // Handle null coffee
  if (!coffee) {
    return null;
  }

  const handleAddToCart = () => {
    // Safely get the display name
    const displayName = (coffee.displayName || coffee.name || 'Coffee').replace(/^(takeaway|eat-in)\s+/i, '');
    
    // Create the item for cart
    const item = {
      id: coffee.uuid || coffee.id || `coffee-${Date.now()}`,
      name: buildItemName(displayName),
      price: price,
      options: {
        milk: milkType,
        caffeinated: isCaffeinated,
        size: selectedSize
      },
      quantity: quantity,
      originalProduct: coffee
    };
    
    addToCart(item);
    onClose();
  };

  const buildItemName = (baseName) => {
    let name = baseName || 'Coffee';
    
    // Add size if not regular
    if (selectedSize !== 'Regular') {
      name = `${selectedSize} ${name}`;
    }
    
    // Add decaf if selected
    if (!isCaffeinated) {
      name = `Decaf ${name}`;
    }
    
    // Add milk type if not dairy
    if (milkType !== 'Dairy') {
      name = `${name} with ${milkType}`;
    }
    
    return name;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">
              {(coffee.displayName || coffee.name || 'Coffee').replace(/^(takeaway|eat-in)\s+/i, '')}
            </h2>
            <button onClick={onClose} className="text-gray-600 hover:text-gray-800">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Size Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Size
            </label>
            <div className="grid grid-cols-3 gap-2">
              {['Small', 'Regular', 'Large'].map(size => (
                <button
                  key={size}
                  className={`py-2 px-4 rounded border ${
                    selectedSize === size 
                      ? 'bg-black text-white border-black' 
                      : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setSelectedSize(size)}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
          
          {/* Milk Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Milk
            </label>
            <select
              value={milkType}
              onChange={(e) => setMilkType(e.target.value)}
              className="block w-full py-2 px-3 border border-gray-300 bg-white rounded shadow-sm focus:outline-none focus:ring-black focus:border-black"
            >
              {milkOptions.milks.map(milk => (
                <option key={milk} value={milk}>{milk}</option>
              ))}
            </select>
          </div>
          
          {/* Caffeination Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Caffeination
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                className={`py-2 px-4 rounded border ${
                  isCaffeinated 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setIsCaffeinated(true)}
              >
                Regular
              </button>
              <button
                className={`py-2 px-4 rounded border ${
                  !isCaffeinated 
                    ? 'bg-black text-white border-black' 
                    : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
                }`}
                onClick={() => setIsCaffeinated(false)}
              >
                Decaf
              </button>
            </div>
          </div>
          
          {/* Quantity and Add to Cart */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="bg-gray-200 px-3 py-1 rounded-l"
              >
                -
              </button>
              <span className="bg-gray-100 px-4 py-1">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="bg-gray-200 px-3 py-1 rounded-r"
              >
                +
              </button>
            </div>
            <span className="text-xl font-bold">£{(price * quantity / 100).toFixed(2)}</span>
          </div>
          
          <button
            onClick={handleAddToCart}
            className="w-full bg-black text-white py-3 rounded font-medium hover:bg-gray-800 transition"
          >
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomizationModal;