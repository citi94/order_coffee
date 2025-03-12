import React from 'react';

const CoffeeCard = ({ coffee, onSelect }) => {
  // Get the base price - use the first variant or default price
  const basePrice = coffee.variants && coffee.variants.length > 0
    ? coffee.variants[0].price?.amount || coffee.price
    : coffee.price;
  
  // Coffee icons mapping
  const getCoffeeIcon = (coffeeName) => {
    const name = coffeeName.toLowerCase();
    
    if (name.includes('latte')) {
      return '☕️';
    } else if (name.includes('cappuccino')) {
      return '☕️';
    } else if (name.includes('espresso')) {
      return '☕';
    } else if (name.includes('americano')) {
      return '☕️';
    } else if (name.includes('mocha')) {
      return '☕️';
    } else if (name.includes('flat white')) {
      return '☕️';
    } else if (name.includes('macchiato')) {
      return '☕';
    } else if (name.includes('cortado')) {
      return '☕';
    } else {
      return '☕️';
    }
  };

  return (
    <button 
      onClick={onSelect}
      className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition-all flex flex-col items-center justify-between h-full"
    >
      <div className="text-4xl mb-2">{getCoffeeIcon(coffee.displayName)}</div>
      <h3 className="font-bold text-lg mb-1">{coffee.displayName}</h3>
      <p className="text-gray-700">£{(basePrice / 100).toFixed(2)}</p>
    </button>
  );
};

export default CoffeeCard;