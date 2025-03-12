import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const CoffeeProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState({});
  const [displayName, setDisplayName] = useState('');

  // Process the product name on mount
  useEffect(() => {
    // Remove "Takeaway" or "Eat-In" prefix for display
    let name = product.name;
    if (name.startsWith('Takeaway ')) {
      name = name.replace('Takeaway ', '');
    } else if (name.startsWith('Eat-In ')) {
      name = name.replace('Eat-In ', '');
    }
    setDisplayName(name);
  }, [product.name]);

  // Find takeaway variant for this product
  const findTakeawayVariants = () => {
    if (!product.variants || !Array.isArray(product.variants)) {
      return [];
    }

    // For products with Finish option
    const takeawayVariants = product.variants.filter(variant => {
      if (!variant.options) return false;
      return variant.options.some(option => 
        option.name === "Finish" && option.value.includes("Takeaway")
      );
    });

    // If no explicit takeaway variants, check if the product name starts with "Takeaway"
    if (takeawayVariants.length === 0 && product.name.startsWith('Takeaway')) {
      return product.variants;
    }

    return takeawayVariants.length > 0 ? takeawayVariants : product.variants;
  };

  // Get all the milk options available for this product
  const extractMilkOptions = () => {
    const variants = findTakeawayVariants();
    const milkOptions = new Set();
    
    variants.forEach(variant => {
      if (!variant.options) return;
      
      variant.options.forEach(option => {
        if (option.name === "flavour") {
          milkOptions.add(option.value);
        }
      });
    });
    
    return Array.from(milkOptions).map(milk => ({
      id: milk.toLowerCase().replace(/\s+/g, ''),
      name: milk,
      // All milk options appear to be the same price based on your data
      priceDelta: 0
    }));
  };

  // Get all caffeination options
  const extractCaffeinationOptions = () => {
    const variants = findTakeawayVariants();
    const caffOptions = new Set();
    
    variants.forEach(variant => {
      if (!variant.options) return;
      
      variant.options.forEach(option => {
        if (option.name === "Style") {
          caffOptions.add(option.value);
        }
      });
    });
    
    return Array.from(caffOptions).map(style => ({
      id: style.toLowerCase().trim().replace(/\s+/g, ''),
      name: style.trim()
    }));
  };

  // Find the right variant based on selected options
  const findMatchingVariant = (options) => {
    if (!product.variants) return null;
    
    // Extract the needed options
    const milkType = options.milk || "Dairy";
    const caffType = options.caffeination || "Caffeinated";
    
    // Find a matching variant
    return product.variants.find(variant => {
      if (!variant.options) return false;
      
      // Check for matching milk
      const hasMilk = variant.options.some(opt => 
        opt.name === "flavour" && opt.value === milkType
      );
      
      // Check for matching caffeination
      const hasCaff = variant.options.some(opt => 
        opt.name === "Style" && opt.value.trim() === caffType
      );
      
      // Check for takeaway
      const isTakeaway = variant.options.some(opt => 
        opt.name === "Finish" && opt.value.includes("Takeaway")
      );
      
      // For products with "Finish" option, must be takeaway
      if (variant.options.some(opt => opt.name === "Finish")) {
        return hasMilk && hasCaff && isTakeaway;
      }
      
      // For products without "Finish" but with other options
      return hasMilk && hasCaff;
    });
  };

  const handleMilkChange = (e) => {
    setSelectedOptions({
      ...selectedOptions,
      milk: e.target.value
    });
  };

  const handleCaffeinationChange = (e) => {
    setSelectedOptions({
      ...selectedOptions,
      caffeination: e.target.value
    });
  };

  const handleAddToCart = () => {
    // Build options object for the cart
    const options = { ...selectedOptions };
    
    // Find matching variant if available
    const matchingVariant = findMatchingVariant(options);
    
    // Determine the price to use
    const price = matchingVariant ? 
      (matchingVariant.price ? matchingVariant.price.amount : product.price) : 
      product.price;
    
    // Build the item name
    let itemName = displayName;
    
    // Add options to name if specified
    if (options.caffeination && options.caffeination !== "Caffeinated") {
      itemName = `${itemName} (${options.caffeination})`;
    }
    
    if (options.milk && options.milk !== "Dairy") {
      itemName = `${itemName} with ${options.milk}`;
    }
    
    // Add to cart
    addToCart({
      id: matchingVariant ? matchingVariant.uuid : product.id,
      name: itemName,
      price: price,
      options: options,
      quantity: quantity,
      productId: product.uuid // Original product ID for reference
    });
    
    // Reset selection
    setQuantity(1);
    setSelectedOptions({});
  };

  // Only show for takeaway coffee products
  const isCoffeeProduct = product.category && product.category.name === 'Coffee';
  const milkOptions = extractMilkOptions();
  const caffeinationOptions = extractCaffeinationOptions();
  
  // Skip non-takeaway or non-coffee products
  if (!isCoffeeProduct || (product.name.startsWith('Eat-In') && !findTakeawayVariants().length)) {
    return null;
  }

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white h-full flex flex-col">
      <div className="p-4 flex-grow">
        <h3 className="text-xl font-semibold mb-2">{displayName}</h3>
        
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
        
        {/* Milk options */}
        {milkOptions.length > 0 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Milk
            </label>
            <select
              className="w-full border rounded p-2"
              value={selectedOptions.milk || "Dairy"}
              onChange={handleMilkChange}
            >
              {milkOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Caffeination options */}
        {caffeinationOptions.length > 1 && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Coffee Type
            </label>
            <select
              className="w-full border rounded p-2"
              value={selectedOptions.caffeination || "Caffeinated"}
              onChange={handleCaffeinationChange}
            >
              {caffeinationOptions.map((option) => (
                <option key={option.id} value={option.name}>
                  {option.name}
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

export default CoffeeProductCard;