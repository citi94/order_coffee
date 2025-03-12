import React, { useState } from 'react';
import { useCart } from '../context/CartContext';

const ProductCard = ({ product }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  const handleAddToCart = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price,
      options: {},
      quantity: quantity
    });
    
    // Reset quantity
    setQuantity(1);
  };

  return (
    <div className="border rounded-lg overflow-hidden shadow-md bg-white h-full flex flex-col">
      {product.imageUrl && (
        <div className="h-48 bg-gray-200">
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
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