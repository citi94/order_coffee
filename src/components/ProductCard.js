import React, { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product, originalProductData }) => {
  const { addToCart } = useCart();
  const [selectedOptions, setSelectedOptions] = useState({});
  const [quantity, setQuantity] = useState(1);
  const [hasVariants, setHasVariants] = useState(false);
  const [variants, setVariants] = useState([]);
  const [selectedVariant, setSelectedVariant] = useState('');

  // Examine the product data to extract any options or variants
  useEffect(() => {
    // Check if the product has multiple variants
    if (originalProductData && originalProductData.variants && originalProductData.variants.length > 1) {
      setHasVariants(true);
      setVariants(originalProductData.variants);
      // Set default variant to the first one
      setSelectedVariant(originalProductData.variants[0].uuid);
    }
  }, [originalProductData]);

  // Determine if this is a coffee drink
  const isCoffeeDrink = product.category === 'Coffee' && 
                        !product.name.toLowerCase().includes('espresso') &&
                        !product.name.toLowerCase().includes('americano');

  // Default milk options - used when no specific milk options found in the API
  const defaultMilkOptions = [
    { id: 'regular', name: 'Regular Milk', priceDelta: 0 },
    { id: 'oat', name: 'Oat Milk', priceDelta: 0 },  // No extra charge for oat milk
    { id: 'almond', name: 'Almond Milk', priceDelta: 0 },
    { id: 'soy', name: 'Soy Milk', priceDelta: 0 }
  ];

  // Handle variant selection
  const handleVariantChange = (e) => {
    setSelectedVariant(e.target.value);
  };

  // Handle milk option selection
  const handleMilkChange = (e) => {
    setSelectedOptions({
      ...selectedOptions,
      milk: e.target.value
    });
  };

  // Calculate the current price based on selected variant
  const getCurrentPrice = () => {
    if (hasVariants && selectedVariant) {
      const variant = variants.find(v => v.uuid === selectedVariant);
      return variant && variant.price ? variant.price.amount : product.price;
    }
    return product.price;
  };

  const getVariantName = () => {
    if (hasVariants && selectedVariant) {
      const variant = variants.find(v => v.uuid === selectedVariant);
      return variant && variant.name ? ` (${variant.name})` : '';
    }
    return '';
  };

  const handleAddToCart = () => {
    // Create item name including variant if selected
    const itemName = `${product.name}${getVariantName()}`;
    
    // Calculate final price based on selected variant
    const finalPrice = getCurrentPrice();
    
    // Add the item to cart
    addToCart({
      id: hasVariants && selectedVariant ? selectedVariant : product.id,
      name: itemName,
      productId: product.id, // Always store the original product ID
      price: finalPrice,
      options: selectedOptions,
      quantity: quantity
    });
    
    // Reset selection
    setQuantity(1);
    setSelectedOptions({});
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white h-full flex flex-col">
      <div className="p-4 flex-grow">
        <h3 className="text-xl font-semibold mb-2">{product.name}</h3>
        
        {product.description && (
          <p className="text-gray-600 mb-4">{product.description}</p>
        )}
        
        <div className="flex justify-between items-center mb-4">
          <span className="text-lg font-bold">£{(getCurrentPrice() / 100).toFixed(2)}</span>
          
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
        
        {/* Variant selection - if product has variants */}
        {hasVariants && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Size
            </label>
            <select
              className="w-full border rounded p-2"
              value={selectedVariant}
              onChange={handleVariantChange}
            >
              {variants.map((variant) => (
                <option key={variant.uuid} value={variant.uuid}>
                  {variant.name || 'Regular'} 
                  {/* Show price difference if different from default */}
                  {variant.price && product.price !== variant.price.amount && 
                    ` - £${(variant.price.amount / 100).toFixed(2)}`}
                </option>
              ))}
            </select>
          </div>
        )}
        
        {/* Milk options for coffee drinks */}
        {isCoffeeDrink && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Milk Option
            </label>
            <select
              className="w-full border rounded p-2"
              value={selectedOptions.milk || ''}
              onChange={handleMilkChange}
            >
              <option value="">Regular Milk</option>
              {defaultMilkOptions.filter(o => o.id !== 'regular').map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                  {option.priceDelta > 0 && ` (+£${(option.priceDelta / 100).toFixed(2)})`}
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